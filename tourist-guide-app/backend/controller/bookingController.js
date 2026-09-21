const mongoose = require("mongoose")
const Booking = require('../models/booking-Model');
const Post = require('../models/post');
const User = require('../models/userModel');
const GuideAvailability = require('../models/guideAvailability-Model');
const CustomPackage = require('../models/customPackage-Model'); 
const Asset = require('../models/asset-Model'); 
const Payment = require('../models/payment-Model');
const FinalBill = require('../models/finalBill-Model');
const sendEmail = require('../utils/sendEmail');
const { sendNotification, NotificationTemplates } = require('../utils/notificationHelper');

const BOOKING_BLOCKING_STATUSES = ['pending', 'confirmed'];
const DEFAULT_PACKAGES = [
    { name: 'Standard', multiplier: 1.0 },
    { name: 'Medium', multiplier: 1.5 },
    { name: 'Premium', multiplier: 3.0 },
];
const generateFourDigitOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const startOfDay = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const endOfDay = (value) => {
    const start = startOfDay(value);
    if (!start) return null;
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
};

const syncBookingPaymentStatus = async (booking) => {
    if (!booking) return booking;
    
    try {
        const successfulPayments = await Payment.find({
            booking: booking._id,
            status: 'paid'
        });
        
        if (successfulPayments.length > 0) {
            let hasFullOrFinal = false;
            let hasDeposit = false;
            
            for (const p of successfulPayments) {
                if (p.type === 'full' || p.type === 'final') {
                    hasFullOrFinal = true;
                } else if (p.type === 'deposit') {
                    hasDeposit = true;
                }
            }
            
            let needsUpdate = false;
            const updateFields = {};
            
            if (hasFullOrFinal && booking.paymentStatus !== 'fully_paid') {
                updateFields.paymentStatus = 'fully_paid';
                if (booking.status === 'pending') {
                    updateFields.status = 'confirmed';
                }
                needsUpdate = true;
            } else if (hasDeposit && !hasFullOrFinal && booking.paymentStatus !== 'deposit_paid') {
                updateFields.paymentStatus = 'deposit_paid';
                if (booking.status === 'pending') {
                    updateFields.status = 'confirmed';
                }
                needsUpdate = true;

                // Trigger auto bill generation in background
                const { autoGenerateFinalBill } = require('./finalBillController');
                autoGenerateFinalBill(booking._id).catch(err => console.error("Error auto-generating bill in sync:", err));
            }
            
            if (needsUpdate) {
                const updated = await Booking.findByIdAndUpdate(booking._id, updateFields, { returnDocument: 'after' })
                    .populate('tourist', 'name email avatar phone')
                    .populate('guide', 'name email avatar phone location')
                    .populate('post', 'title photo price location packages')
                    .populate({
                        path: 'customPackageId',
                        populate: {
                            path: 'selectedAssets.assetId',
                            select: 'name type pricePerDay'
                        }
                    });
                return updated;
            }
        }
    } catch (err) {
        console.error("Error syncing booking payment status:", err);
    }
    return booking;
};


const getInclusiveDays = (startDate, endDate) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((startOfDay(endDate) - startOfDay(startDate)) / msPerDay) + 1;
};

const getBookedAssetQuantityForDates = async (assetId, startDate, endDate, ignoreBookingId = null, session = null) => {
    const query = {
        status: { $in: ['pending', 'confirmed'] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
    };
    if (ignoreBookingId) {
        query._id = { $ne: ignoreBookingId };
    }

    const bookingsQuery = Booking.find(query);
    if (session) {
        bookingsQuery.session(session);
    }
    const bookings = await bookingsQuery.populate('customPackageId');

    let bookedQty = 0;
    for (const b of bookings) {
        if (b.customPackageId && b.customPackageId.selectedAssets) {
            const assetItem = b.customPackageId.selectedAssets.find(
                a => a.assetId.toString() === assetId.toString()
            );
            if (assetItem) {
                bookedQty += assetItem.quantity;
            }
        }
        if (b.selectedAssets) {
            const assetItem = b.selectedAssets.find(
                a => a.assetId.toString() === assetId.toString()
            );
            if (assetItem) {
                bookedQty += assetItem.quantity;
            }
        }
    }
    return bookedQty;
};

const parseBookingRange = ({ startDate, endDate, tourDate }) => {
    const requestedStart = startOfDay(startDate || tourDate);
    const requestedEnd = endOfDay(endDate || startDate || tourDate);

    if (!requestedStart || !requestedEnd) {
        return { error: "Invalid tour date range" };
    }

    if (requestedEnd < requestedStart) {
        return { error: "End date cannot be before start date" };
    }

    const today = startOfDay(new Date());
    if (requestedStart < today) {
        return { error: "Booking date must be today or later" };
    }

    return {
        startDate: requestedStart,
        endDate: requestedEnd,
        durationDays: getInclusiveDays(requestedStart, requestedEnd)
    };
};

const findGuideDateConflict = async (guideId, startDate, endDate, ignoreBookingId = null) => {
    const bookingQuery = {
        guide: guideId,
        status: { $in: BOOKING_BLOCKING_STATUSES },
        $or: [
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
            { startDate: { $exists: false }, tourDate: { $gte: startDate, $lte: endDate } }
        ]
    };

    if (ignoreBookingId) {
        bookingQuery._id = { $ne: ignoreBookingId };
    }

    const [bookingConflict, blockedRange] = await Promise.all([
        Booking.findOne(bookingQuery).select('_id status startDate endDate'),
        GuideAvailability.findOne({
            guide: guideId,
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).select('_id reason startDate endDate')
    ]);

    if (bookingConflict) {
        return {
            type: 'booking',
            message: "Guide already has a booking request for the selected dates"
        };
    }

    if (blockedRange) {
        return {
            type: 'blocked',
            message: blockedRange.reason
                ? `Guide is unavailable for the selected dates: ${blockedRange.reason}`
                : "Guide is unavailable for the selected dates"
        };
    }

    return null;
};

// 🔹 Helper to calculate custom package total
const calculateCustomPackageTotal = (postPrice, packageData, numberOfPeople, durationDays) => {
    // packageData.selectedAssets: array of { assetId, quantity, pricePerDay }
    // base price = postPrice * people * days
    let baseTotal = postPrice * numberOfPeople * durationDays;

    // Asset total
    let assetTotal = 0;
    if (packageData.selectedAssets && packageData.selectedAssets.length) {
        assetTotal = packageData.selectedAssets.reduce((sum, asset) => {
            return sum + (asset.pricePerDay * asset.quantity * durationDays);
        }, 0);
    }

    // Group discount (apply to base price only, not assets)
    let discount = 0;
    if (numberOfPeople >= 5 && numberOfPeople < 8) discount = 0.10;
    else if (numberOfPeople >= 8 && numberOfPeople < 10) discount = 0.15;
    else if (numberOfPeople >= 10) discount = 0.20;

    const discountedBase = baseTotal * (1 - discount);
    return discountedBase + assetTotal;
};

// ===================== CREATE BOOKING (updated) =====================
// exports.createBooking = async (req, res) => {
//     try {
//         // Only tourists can book
//         if (req.user.role !== 'tourist') {
//             return res.status(403).json({ error: "Only tourists can create bookings" });
//         }

//         const { 
//             postId, 
//             customPackageId, 
//             tourDate, startDate, endDate, 
//             numberOfPeople, 
//             specialRequests, 
//             selectedPackage 
//         } = req.body;

//         // ----- CASE 1: Custom Package Booking -----
//         if (customPackageId) {
//             // Fetch custom package with assets populated
//             const customPackage = await CustomPackage.findById(customPackageId)
//                 .populate('post')          // post details
//                 .populate('guide')         // guide details
//                 .populate('selectedAssets.assetId'); // asset details (optional)

//             if (!customPackage) {
//                 return res.status(404).json({ error: "Custom package not found" });
//             }

//             // Validate ownership: package belongs to this tourist
//             if (customPackage.tourist.toString() !== req.user._id.toString()) {
//                 return res.status(403).json({ error: "You do not own this custom package" });
//             }

//             // Validate package status and expiry
//             if (customPackage.status === 'booked' || customPackage.status === 'expired') {
//                 return res.status(400).json({ error: "This custom package is no longer available" });
//             }
//             if (customPackage.expiresAt && new Date() > customPackage.expiresAt) {
//                 return res.status(400).json({ error: "Price lock has expired. Please re-estimate." });
//             }

//             // Use dates and people from the package (or allow override? We'll use package values)
//             const pkgStart = customPackage.startDate;
//             const pkgEnd = customPackage.endDate;
//             const pkgPeople = customPackage.numberOfPeople;

//             // Parse range (reuse function)
//             const parsedRange = parseBookingRange({ startDate: pkgStart, endDate: pkgEnd });
//             if (parsedRange.error) {
//                 return res.status(400).json({ error: parsedRange.error });
//             }

//             // Get post and guide from package
//             const post = customPackage.post;
//             if (!post) {
//                 return res.status(400).json({ error: "Custom package missing post reference" });
//             }
//             const guideId = customPackage.guide._id || customPackage.guide;

//             // Conflict check
//             const conflict = await findGuideDateConflict(guideId, parsedRange.startDate, parsedRange.endDate);
//             if (conflict) {
//                 return res.status(409).json({ error: conflict.message });
//             }

//             // Calculate total
//             const normalizedPrice = Number(post.price);
//             if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
//                 return res.status(400).json({ error: "Invalid base price in post" });
//             }

//             const totalPrice = calculateCustomPackageTotal(
//                 normalizedPrice,
//                 customPackage,
//                 pkgPeople,
//                 parsedRange.durationDays
//             );

//             // Create booking with customPackageId
//             const booking = new Booking({
//                 tourist: req.user._id,
//                 guide: guideId,
//                 post: post._id,
//                 tourDate: parsedRange.startDate,
//                 startDate: parsedRange.startDate,
//                 endDate: parsedRange.endDate,
//                 durationDays: parsedRange.durationDays,
//                 numberOfPeople: pkgPeople,
//                 customPackageId: customPackage._id,
//                 // selectedPackage will default to Standard/1 (we can set to null if we want)
//                 selectedPackage: null, // or omit
//                 totalPrice,
//                 specialRequests,
//                 status: 'pending'
//             });

//             await booking.save();

//             // Update custom package status to 'booked' (so it can't be reused)
//             customPackage.status = 'booked';
//             await customPackage.save();

//             // Send notification to guide
//             const tourist = await User.findById(req.user._id).select('name');
//             const bookingRequestNotification = NotificationTemplates.bookingRequest(
//                 tourist?.name || req.user.name
//             );
//             await sendNotification(
//                 guideId,
//                 req.user._id,
//                 'booking_request',
//                 bookingRequestNotification.title,
//                 bookingRequestNotification.message,
//                 booking._id,
//                 'Booking'
//             );

//             const populatedBooking = await Booking.findById(booking._id)
//                 .populate('tourist', 'name email avatar')
//                 .populate('guide', 'name email avatar phone')
//                 .populate('post', 'title price location packages')
//                 .populate('customPackageId'); // populate custom package

//             return res.status(201).json({
//                 success: true,
//                 message: "Booking request sent successfully (custom package)",
//                 booking: populatedBooking
//             });
//         }

//         // ----- CASE 2: Traditional Fixed Package Booking (existing code) -----
//         if (!postId || !(tourDate || startDate) || numberOfPeople === undefined || numberOfPeople === null) {
//             return res.status(400).json({
//                 error: "Post, tour date range, and number of people are required"
//             });
//         }

//         const normalizedPeople = Number(numberOfPeople);
//         if (!Number.isFinite(normalizedPeople) || normalizedPeople < 1 || normalizedPeople > 20) {
//             return res.status(400).json({
//                 error: "Number of people must be between 1 and 20"
//             });
//         }

//         const parsedRange = parseBookingRange({ startDate, endDate, tourDate });
//         if (parsedRange.error) {
//             return res.status(400).json({ error: parsedRange.error });
//         }

//         const post = await Post.findById(postId);
//         if (!post) {
//             return res.status(404).json({ error: "Post not found" });
//         }

//         const normalizedPrice = Number(post.price);
//         if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
//             return res.status(400).json({
//                 error: "This guide post has an invalid price. Please ask the guide to update it before booking."
//             });
//         }

//         const requestedPackageName = typeof selectedPackage === 'string'
//             ? selectedPackage
//             : selectedPackage?.name;
//         const packageName = requestedPackageName || 'Standard';
//         const availablePackages = Array.isArray(post.packages) && post.packages.length
//             ? post.packages
//             : DEFAULT_PACKAGES;
//         const packageOption = availablePackages.find((pkg) => pkg.name === packageName);

//         if (!packageOption) {
//             return res.status(400).json({
//                 error: "Invalid package selected"
//             });
//         }

//         const packageMultiplier = Number(packageOption.multiplier);
//         if (!Number.isFinite(packageMultiplier) || packageMultiplier < 0) {
//             return res.status(400).json({
//                 error: "Selected package has an invalid price multiplier"
//             });
//         }

//         const guideId = post.postedBy;
//         if (!guideId) {
//             return res.status(400).json({
//                 error: "This guide post is missing owner information"
//             });
//         }

//         const conflict = await findGuideDateConflict(guideId, parsedRange.startDate, parsedRange.endDate);
//         if (conflict) {
//             return res.status(409).json({ error: conflict.message });
//         }

//         const totalPrice = normalizedPrice * packageMultiplier * normalizedPeople * parsedRange.durationDays;
//         if (!Number.isFinite(totalPrice)) {
//             return res.status(400).json({
//                 error: "Unable to calculate booking price for this trip"
//             });
//         }

//         const booking = new Booking({
//             tourist: req.user._id,
//             guide: guideId,
//             post: postId,
//             tourDate: parsedRange.startDate,
//             startDate: parsedRange.startDate,
//             endDate: parsedRange.endDate,
//             durationDays: parsedRange.durationDays,
//             numberOfPeople: normalizedPeople,
//             selectedPackage: {
//                 name: packageOption.name,
//                 multiplier: packageMultiplier
//             },
//             totalPrice,
//             specialRequests,
//             status: 'pending'
//         });

//         await booking.save();

//         const tourist = await User.findById(req.user._id).select('name');
//         const bookingRequestNotification = NotificationTemplates.bookingRequest(
//             tourist?.name || req.user.name
//         );

//         await sendNotification(
//             guideId,
//             req.user._id,
//             'booking_request',
//             bookingRequestNotification.title,
//             bookingRequestNotification.message,
//             booking._id,
//             'Booking'
//         );

//         const populatedBooking = await Booking.findById(booking._id)
//             .populate('tourist', 'name email avatar')
//             .populate('guide', 'name email avatar phone')
//             .populate('post', 'title price location packages');

//         res.status(201).json({
//             success: true,
//             message: "Booking request sent successfully",
//             booking: populatedBooking
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Server error" });
//     }
// };

// (Remaining functions – getMyBookings, getGuideBookings, etc. – unchanged)
// ... (keep all other exports as they are) ...


exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ tourist: req.user._id })
            .populate('guide', 'name email avatar phone location')
            .populate('post', 'title photo price location')
            .populate({
                path: 'customPackageId',
                populate: {
                    path: 'selectedAssets.assetId',
                    select: 'name type pricePerDay'
                }
            })
            .populate({
                path: 'selectedAssets.assetId',
                select: 'name type pricePerDay'
            })
            .populate({
                path: 'addOnPayments.items.assetId',
                select: 'name type pricePerDay'
            })
            .sort('-createdAt');

        const syncedBookings = await Promise.all(bookings.map(async (b) => {
            if (b.paymentStatus === 'deposit_pending' || b.paymentStatus === 'pending' || b.paymentStatus === 'final_pending') {
                return await syncBookingPaymentStatus(b);
            }
            return b;
        }));

        res.json({ success: true, count: syncedBookings.length, bookings: syncedBookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getGuideBookings = async (req, res) => {
    try {
        if (!['guide', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Only guides can view booking requests" });
        }

        const query = req.user.role === 'admin' ? {} : { guide: req.user._id };
        const bookings = await Booking.find(query)
            .populate('tourist', 'name email avatar phone')
            .populate('guide', 'name email avatar phone location')
            .populate('post', 'title photo price location')
            .populate({
                path: 'customPackageId',
                populate: {
                    path: 'selectedAssets.assetId',
                    select: 'name type pricePerDay'
                }
            })
            .populate({
                path: 'selectedAssets.assetId',
                select: 'name type pricePerDay'
            })
            .populate({
                path: 'addOnPayments.items.assetId',
                select: 'name type pricePerDay'
            })
            .sort('-createdAt');

        const syncedBookings = await Promise.all(bookings.map(async (b) => {
            if (b.paymentStatus === 'deposit_pending' || b.paymentStatus === 'pending' || b.paymentStatus === 'final_pending') {
                return await syncBookingPaymentStatus(b);
            }
            return b;
        }));

        res.json({ success: true, count: syncedBookings.length, bookings: syncedBookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAdminBookingStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only admins can view booking stats" });
        }

        const [total, pending, confirmed, completed, cancelled] = await Promise.all([
            Booking.countDocuments({}),
            Booking.countDocuments({ status: 'pending' }),
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.countDocuments({ status: 'completed' }),
            Booking.countDocuments({ status: 'cancelled' })
        ]);

        res.json({
            success: true,
            stats: { total, pending, confirmed, completed, cancelled, tripsDone: completed }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getBookingDetails = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate('tourist', 'name email avatar phone')
            .populate('guide', 'name email avatar phone location')
            .populate('post', 'title photo price location packages')
            .populate({
                path: 'customPackageId',
                populate: {
                    path: 'selectedAssets.assetId',
                    select: 'name type pricePerDay'
                }
            })
            .populate({
                path: 'selectedAssets.assetId',
                select: 'name type pricePerDay'
            })
            .populate({
                path: 'addOnPayments.items.assetId',
                select: 'name type pricePerDay'
            });

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const syncedBooking = await syncBookingPaymentStatus(booking);

        const isTourist = syncedBooking.tourist?._id?.toString() === req.user._id.toString();
        const isGuide = syncedBooking.guide?._id?.toString() === req.user._id.toString();
        if (!isTourist && !isGuide && req.user.role !== 'admin') {
            return res.status(403).json({ error: "You are not allowed to view this booking" });
        }

        const finalBill = await FinalBill.findOne({ booking: bookingId });
        const bookingObj = syncedBooking.toObject ? syncedBooking.toObject() : syncedBooking;
        bookingObj.finalBillExists = !!finalBill;
        if (finalBill) {
            bookingObj.finalBillUrl = finalBill.pdfUrl;
        }

        res.json({ success: true, booking: bookingObj });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getGuideAvailability = async (req, res) => {
    try {
        const { guideId } = req.params;
        const { from, to } = req.query;
        const rangeStart = startOfDay(from || new Date());
        const defaultEnd = new Date(rangeStart);
        defaultEnd.setUTCMonth(defaultEnd.getUTCMonth() + 3);
        const rangeEnd = endOfDay(to || defaultEnd);

        if (!guideId) {
            return res.status(400).json({ error: "Guide is required" });
        }

        if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) {
            return res.status(400).json({ error: "Invalid calendar range" });
        }

        const [blockedRanges, bookings] = await Promise.all([
            GuideAvailability.find({
                guide: guideId,
                startDate: { $lte: rangeEnd },
                endDate: { $gte: rangeStart }
            }).sort('startDate'),
            Booking.find({
                guide: guideId,
                status: { $in: BOOKING_BLOCKING_STATUSES },
                $or: [
                    { startDate: { $lte: rangeEnd }, endDate: { $gte: rangeStart } },
                    { startDate: { $exists: false }, tourDate: { $gte: rangeStart, $lte: rangeEnd } }
                ]
            }).select('tourDate startDate endDate durationDays status post').populate('post', 'title').sort('startDate')
        ]);

        res.json({ success: true, availability: { from: rangeStart, to: rangeEnd, blockedRanges, bookings } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.blockGuideAvailability = async (req, res) => {
    try {
        if (!['guide', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Only guides can manage availability" });
        }

        const { startDate, endDate, reason } = req.body;
        const parsedRange = parseBookingRange({ startDate, endDate });
        if (parsedRange.error) {
            return res.status(400).json({ error: parsedRange.error });
        }

        const guideId = req.user.role === 'admin' && req.body.guideId ? req.body.guideId : req.user._id;
        const conflict = await findGuideDateConflict(guideId, parsedRange.startDate, parsedRange.endDate);
        if (conflict) {
            return res.status(409).json({ error: conflict.message });
        }

        const blockedRange = new GuideAvailability({
            guide: guideId,
            startDate: parsedRange.startDate,
            endDate: parsedRange.endDate,
            reason
        });

        await blockedRange.save();
        res.status(201).json({ success: true, message: "Availability updated successfully", blockedRange });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deleteGuideAvailability = async (req, res) => {
    try {
        if (!['guide', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Only guides can manage availability" });
        }

        const { availabilityId } = req.params;
        const blockedRange = await GuideAvailability.findById(availabilityId);
        if (!blockedRange) {
            return res.status(404).json({ error: "Blocked date range not found" });
        }

        if (blockedRange.guide.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: "You can only remove your own blocked dates" });
        }

        await blockedRange.deleteOne();
        res.json({ success: true, message: "Blocked dates removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { cancellationReason } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.tourist.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You can only cancel your own bookings" });
        }

        if (['cancelled', 'completed'].includes(booking.status)) {
            return res.status(400).json({ error: `Cannot cancel a ${booking.status} booking` });
        }

        const normalizedReason = String(cancellationReason || '').trim();
        if (normalizedReason.length > 300) {
            return res.status(400).json({ error: "Cancellation reason must be 300 characters or less" });
        }

        booking.status = 'cancelled';
        booking.cancellationReason = normalizedReason;
        booking.statusOtp = undefined;
        await booking.save();

        const updatedBooking = await Booking.findById(bookingId)
            .populate('tourist', 'name email avatar')
            .populate('guide', 'name email avatar')
            .populate('post', 'title price')
            .populate({
                path: 'customPackageId',
                populate: {
                    path: 'selectedAssets.assetId',
                    select: 'name type pricePerDay'
                }
            });

        const notificationTitle = 'Booking Cancelled';
        const notificationMessage = 'A booking was cancelled by the tourist';
        await sendNotification(booking.guide, req.user._id, 'booking_cancelled', notificationTitle, notificationMessage, booking._id, 'Booking');

        res.json({ success: true, message: "Booking cancelled successfully", booking: updatedBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.requestBookingStatusOtp = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (status !== 'confirmed') {
            return res.status(400).json({ error: "OTP is only required for confirming bookings" });
        }

        const booking = await Booking.findById(bookingId)
            .populate('tourist', 'name email')
            .populate('guide', 'name email')
            .populate('post', 'title');

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.guide._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only the guide can request confirmation OTP" });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ error: "Only pending bookings can be confirmed with OTP" });
        }

        if (!booking.tourist?.email) {
            return res.status(400).json({ error: "Tourist email is not available for OTP verification" });
        }

        const conflict = await findGuideDateConflict(
            booking.guide._id,
            booking.startDate || booking.tourDate,
            booking.endDate || booking.tourDate,
            booking._id
        );

        if (conflict) {
            return res.status(409).json({ error: conflict.message });
        }

        const otp = generateFourDigitOtp();
        booking.statusOtp = {
            code: otp,
            action: 'confirmed',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        await booking.save();

        await sendEmail({
            email: booking.tourist.email,
            subject: "GullyGuide booking confirmation OTP",
            message: `Your 4-digit OTP to approve "${booking.post?.title || 'your tour'}" is ${otp}. Share it with your guide only if you approve this booking confirmation. This OTP is valid for 10 minutes.`
        });

        res.json({ success: true, message: `4-digit OTP sent to tourist email ${booking.tourist.email}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to send booking confirmation OTP" });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, otp, cancellationReason } = req.body;

        if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const booking = await Booking.findById(bookingId).select('+statusOtp.code +statusOtp.action +statusOtp.expiresAt');
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (booking.guide.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only the guide can update this booking" });
        }

        if (['cancelled', 'completed'].includes(booking.status)) {
            return res.status(400).json({ error: `Cannot update a ${booking.status} booking` });
        }

        if (status === 'completed') {
            if (booking.paymentStatus !== 'fully_paid') {
                const pendingAmount = booking.finalAmount || Math.round(booking.totalPrice * 0.8);
                return res.status(400).json({
                    error: `Cannot mark as completed: final payment of ₹${pendingAmount} is still pending.`
                });
            }
        }

        if (status === 'confirmed') {
            const normalizedOtp = String(otp || '').trim();
            if (!/^\d{4}$/.test(normalizedOtp)) {
                return res.status(400).json({ error: "Enter the 4-digit OTP sent to the tourist email" });
            }

            if (!booking.statusOtp?.code || booking.statusOtp.action !== 'confirmed' || booking.statusOtp.expiresAt < new Date()) {
                return res.status(400).json({ error: "Confirmation OTP is missing or expired. Send a new OTP." });
            }

            if (booking.statusOtp.code !== normalizedOtp) {
                return res.status(400).json({ error: "Invalid OTP. Please enter the exact 4-digit code." });
            }

            const conflict = await findGuideDateConflict(
                booking.guide,
                booking.startDate || booking.tourDate,
                booking.endDate || booking.tourDate,
                booking._id
            );

            if (conflict) {
                return res.status(409).json({ error: conflict.message });
            }

            booking.statusOtp = undefined;
        }

        if (status === 'cancelled') {
            const normalizedReason = String(cancellationReason || '').trim();
            if (!normalizedReason) {
                return res.status(400).json({ error: "Cancellation reason is required" });
            }
            if (normalizedReason.length > 300) {
                return res.status(400).json({ error: "Cancellation reason must be 300 characters or less" });
            }
            booking.cancellationReason = normalizedReason;
            booking.cancelledAt = new Date();

            // Refund logic
            const successfulPayments = await Payment.find({ booking: booking._id, status: 'paid' });
            if (successfulPayments.length > 0) {
                booking.refundStatus = 'pending';
                booking.refundInitiatedAt = new Date();
                
                let totalAmountPaid = 0;
                for (const p of successfulPayments) {
                    totalAmountPaid += p.amount;
                }
                booking.refundAmount = totalAmountPaid;
                
                // Save the booking initial status
                await booking.save();
                
                // Initialize Razorpay
                const Razorpay = require('razorpay');
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });
                const Refund = require('../models/refund-Model');
                
                let processedCount = 0;
                let refundIds = [];
                for (const paymentRecord of successfulPayments) {
                    try {
                        const refundResponse = await razorpay.payments.refund(paymentRecord.razorpayPaymentId, {
                            amount: Math.round(paymentRecord.amount * 100),
                        });
                        
                        await Refund.create({
                            booking: booking._id,
                            payment: paymentRecord._id,
                            user: req.user._id,
                            amount: paymentRecord.amount,
                            currency: 'INR',
                            razorpayPaymentId: paymentRecord.razorpayPaymentId,
                            razorpayRefundId: refundResponse.id,
                            status: refundResponse.status,
                            reason: normalizedReason,
                            metadata: refundResponse,
                        });
                        
                        paymentRecord.status = 'refunded';
                        paymentRecord.paymentStatus = 'refunded';
                        await paymentRecord.save();
                        
                        processedCount++;
                        refundIds.push(refundResponse.id);
                    } catch (refundErr) {
                        console.error(`Razorpay refund error for payment ${paymentRecord.razorpayPaymentId}:`, refundErr);
                        if (refundErr.statusCode === 400 && refundErr.error && (refundErr.error.description || '').toLowerCase().includes('already')) {
                            paymentRecord.status = 'refunded';
                            paymentRecord.paymentStatus = 'refunded';
                            await paymentRecord.save();
                            
                            processedCount++;
                            refundIds.push(`ALREADY_REFUNDED_${paymentRecord.razorpayPaymentId}`);
                            
                            await Refund.create({
                                booking: booking._id,
                                payment: paymentRecord._id,
                                user: req.user._id,
                                amount: paymentRecord.amount,
                                currency: 'INR',
                                razorpayPaymentId: paymentRecord.razorpayPaymentId,
                                razorpayRefundId: `ALREADY_REFUNDED_${paymentRecord.razorpayPaymentId}`,
                                status: 'processed',
                                reason: normalizedReason,
                                metadata: refundErr.error,
                            });
                        }
                    }
                }
                
                if (processedCount > 0) {
                    booking.refundStatus = 'processing';
                    booking.refundId = refundIds.join(', ');
                    booking.paymentStatus = 'refunded';
                } else {
                    booking.refundStatus = 'failed';
                }
            } else {
                booking.refundStatus = 'not_applicable';
            }
        }

        booking.status = status;
        await booking.save();

        const updatedBooking = await Booking.findById(bookingId)
            .populate('tourist', 'name email avatar')
            .populate('guide', 'name email avatar')
            .populate('post', 'title price')
            .populate({
                path: 'customPackageId',
                populate: {
                    path: 'selectedAssets.assetId',
                    select: 'name type pricePerDay'
                }
            });

        if (status === 'confirmed') {
            const notification = NotificationTemplates.bookingConfirmed(req.user.name, updatedBooking?.post?.title || 'your tour');
            await sendNotification(booking.tourist, req.user._id, 'booking_confirmed', notification.title, notification.message, booking._id, 'Booking');
        }

        if (status === 'cancelled') {
            const tourName = updatedBooking?.post?.title || 'your tour';
            const notificationTitle = 'Booking Cancelled';
            const notificationMessage = `Your booking for ${tourName} was cancelled by the guide.`;
            await sendNotification(booking.tourist, req.user._id, 'booking_cancelled', notificationTitle, notificationMessage, booking._id, 'Booking');

            if (booking.refundStatus && booking.refundStatus !== 'not_applicable') {
                const refundTitle = 'Refund Initiated';
                const refundMessage = `Refund of ₹${booking.refundAmount} has been initiated and will reflect in 5-7 business days.`;
                await sendNotification(booking.tourist, req.user._id, 'refund_initiated', refundTitle, refundMessage, booking._id, 'Booking');
            }
        }

        res.json({ success: true, message: `Booking ${status} successfully`, booking: updatedBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};


// ===================== CREATE BOOKING (UPDATED with Inventory Lock) =====================
exports.createBooking = async (req, res) => {
    // Session start karo
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Only tourists can book
        if (req.user.role !== 'tourist') {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ error: "Only tourists can create bookings" });
        }

        const { 
            postId, 
            customPackageId, 
            tourDate, startDate, endDate, 
            numberOfPeople, 
            specialRequests, 
            selectedPackage 
        } = req.body;

        // ----- CASE 1: Custom Package Booking -----
        if (customPackageId) {
            // Fetch custom package
            const customPackage = await CustomPackage.findById(customPackageId)
                .populate('post')
                .populate('guide')
                .session(session); // 🔹 Attach session

            if (!customPackage) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ error: "Custom package not found" });
            }

            // Validate ownership
            if (customPackage.tourist.toString() !== req.user._id.toString()) {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({ error: "You do not own this custom package" });
            }

            // Validate status
            if (customPackage.status === 'booked' || customPackage.status === 'expired') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: "This custom package is no longer available" });
            }
            if (customPackage.expiresAt && new Date() > customPackage.expiresAt) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: "Price lock has expired. Please re-estimate." });
            }

            // Use dates from package
            const parsedRange = parseBookingRange({ 
                startDate: customPackage.startDate, 
                endDate: customPackage.endDate 
            });
            if (parsedRange.error) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ error: parsedRange.error });
            }

            const post = customPackage.post;
            const guideId = customPackage.guide._id || customPackage.guide;

            // 🔹 INVENTORY CHECK (Date-range specific)
            const selectedAssets = customPackage.selectedAssets || [];
            
            for (const item of selectedAssets) {
                const assetId = item.assetId;
                const requestedQty = item.quantity;

                const asset = await Asset.findById(assetId).session(session);
                if (!asset) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ 
                        error: `Asset with ID ${item.assetId} not found` 
                    });
                }

                // Query overlapping pending/confirmed bookings quantity
                const bookedQty = await getBookedAssetQuantityForDates(assetId, parsedRange.startDate, parsedRange.endDate, null, session);

                const netAvailable = Math.max(0, asset.quantityAvailable - bookedQty);
                if (requestedQty > netAvailable) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(409).json({ 
                        error: `Only ${netAvailable} units of "${asset.name}" available for the selected dates` 
                    });
                }
            }

            // Check guide date conflict (after locking inventory)
            const conflict = await findGuideDateConflict(
                guideId, 
                parsedRange.startDate, 
                parsedRange.endDate
            );
            if (conflict) {
                // Rollback inventory changes (automatic due to transaction abort)
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({ error: conflict.message });
            }

            // Calculate total using package's totalEstimate (already locked)
            const totalPrice = customPackage.totalEstimate;

            // Create booking
            const booking = new Booking({
                tourist: req.user._id,
                guide: guideId,
                post: post._id,
                tourDate: parsedRange.startDate,
                startDate: parsedRange.startDate,
                endDate: parsedRange.endDate,
                durationDays: parsedRange.durationDays,
                numberOfPeople: customPackage.numberOfPeople,
                customPackageId: customPackage._id,
                totalPrice,
                specialRequests: specialRequests || customPackage.specialRequests,
                status: 'pending'
            });

            await booking.save({ session });

            // Update custom package status to 'booked'
            customPackage.status = 'booked';
            await customPackage.save({ session });

            // 🔹 COMMIT TRANSACTION – Inventory changes saved permanently
            await session.commitTransaction();
            session.endSession();

            // Send notification (outside transaction – don't need to rollback if email fails)
            const tourist = await User.findById(req.user._id).select('name');
            const bookingRequestNotification = NotificationTemplates.bookingRequest(
                tourist?.name || req.user.name
            );
            await sendNotification(
                guideId,
                req.user._id,
                'booking_request',
                bookingRequestNotification.title,
                bookingRequestNotification.message,
                booking._id,
                'Booking'
            );

            const populatedBooking = await Booking.findById(booking._id)
                .populate('tourist', 'name email avatar')
                .populate('guide', 'name email avatar phone')
                .populate('post', 'title price location packages')
                .populate({
                    path: 'customPackageId',
                    populate: {
                        path: 'selectedAssets.assetId',
                        select: 'name type pricePerDay'
                    }
                });

            return res.status(201).json({
                success: true,
                message: "Booking request sent successfully (custom package with inventory locked)",
                booking: populatedBooking
            });
        }

        // ----- CASE 2: Traditional Fixed Package Booking (Existing Code) -----
        if (!postId || !(tourDate || startDate) || numberOfPeople === undefined || numberOfPeople === null) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Post, tour date range, and number of people are required"
            });
        }

        const normalizedPeople = Number(numberOfPeople);
        if (!Number.isFinite(normalizedPeople) || normalizedPeople < 1 || normalizedPeople > 20) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Number of people must be between 1 and 20"
            });
        }

        const parsedRange = parseBookingRange({ startDate, endDate, tourDate });
        if (parsedRange.error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: parsedRange.error });
        }

        const postObj = await Post.findById(postId).session(session);
        if (!postObj) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Post not found" });
        }

        const normalizedPrice = Number(postObj.price);
        if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "This guide post has an invalid price. Please ask the guide to update it before booking."
            });
        }

        const requestedPackageName = typeof selectedPackage === 'string'
            ? selectedPackage
            : selectedPackage?.name;
        const packageName = requestedPackageName || 'Standard';
        const availablePackages = Array.isArray(postObj.packages) && postObj.packages.length
            ? postObj.packages
            : DEFAULT_PACKAGES;
        const packageOption = availablePackages.find((pkg) => pkg.name === packageName);

        if (!packageOption) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Invalid package selected"
            });
        }

        const packageMultiplier = Number(packageOption.multiplier);
        if (!Number.isFinite(packageMultiplier) || packageMultiplier < 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Selected package has an invalid price multiplier"
            });
        }

        const guideId = postObj.postedBy;
        if (!guideId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "This guide post is missing owner information"
            });
        }

        const conflict = await findGuideDateConflict(guideId, parsedRange.startDate, parsedRange.endDate);
        if (conflict) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ error: conflict.message });
        }

        const totalPrice = normalizedPrice * packageMultiplier * normalizedPeople * parsedRange.durationDays;
        if (!Number.isFinite(totalPrice)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Unable to calculate booking price for this trip"
            });
        }

        const booking = new Booking({
            tourist: req.user._id,
            guide: guideId,
            post: postId,
            tourDate: parsedRange.startDate,
            startDate: parsedRange.startDate,
            endDate: parsedRange.endDate,
            durationDays: parsedRange.durationDays,
            numberOfPeople: normalizedPeople,
            selectedPackage: {
                name: packageOption.name,
                multiplier: packageMultiplier
            },
            totalPrice,
            specialRequests,
            status: 'pending'
        });

        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        const tourist = await User.findById(req.user._id).select('name');
        const bookingRequestNotification = NotificationTemplates.bookingRequest(
            tourist?.name || req.user.name
        );

        await sendNotification(
            guideId,
            req.user._id,
            'booking_request',
            bookingRequestNotification.title,
            bookingRequestNotification.message,
            booking._id,
            'Booking'
        );

        const populatedBooking = await Booking.findById(booking._id)
            .populate('tourist', 'name email avatar')
            .populate('guide', 'name email avatar phone')
            .populate('post', 'title price location packages');

        res.status(201).json({
            success: true,
            message: "Booking request sent successfully",
            booking: populatedBooking
        });

    } catch (error) {
        // Agar koi bhi error aata hai, transaction rollback
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.estimateAddon = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { items } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ success: false, error: `Add-ons are not allowed for ${booking.status} bookings` });
        }

        if (!items || !items.length) {
            return res.status(200).json({ success: true, amount: 0, items: [] });
        }

        const durationDays = booking.durationDays;
        let amount = 0;
        const estimatedItems = [];

        for (const item of items) {
            const asset = await Asset.findById(item.assetId);
            if (!asset) {
                return res.status(404).json({ success: false, error: `Asset with ID ${item.assetId} not found` });
            }

            const bookedQty = await getBookedAssetQuantityForDates(item.assetId, booking.startDate, booking.endDate, booking._id);
            const netAvailable = Math.max(0, asset.quantityAvailable - bookedQty);
            if (item.quantity > netAvailable) {
                return res.status(409).json({
                    success: false,
                    error: `Only ${netAvailable} units of "${asset.name}" available for the selected dates`
                });
            }

            const pricePerDay = asset.pricePerDay || asset.price || 0;
            const totalPrice = pricePerDay * item.quantity * durationDays;
            amount += totalPrice;

            estimatedItems.push({
                assetId: asset._id,
                name: asset.name,
                type: asset.type || asset.category || 'other',
                pricePerDay,
                quantity: item.quantity,
                totalPrice
            });
        }

        res.status(200).json({
            success: true,
            amount,
            items: estimatedItems
        });
    } catch (error) {
        console.error('Estimate Addon Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
};

exports.createAddonOrder = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { items } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ success: false, error: `Add-ons are not allowed for ${booking.status} bookings` });
        }

        if (!items || !items.length) {
            return res.status(400).json({ success: false, error: 'At least one item is required' });
        }

        const durationDays = booking.durationDays;
        let amount = 0;
        const detailedItems = [];

        for (const item of items) {
            const asset = await Asset.findById(item.assetId);
            if (!asset) {
                return res.status(404).json({ success: false, error: `Asset with ID ${item.assetId} not found` });
            }

            const bookedQty = await getBookedAssetQuantityForDates(item.assetId, booking.startDate, booking.endDate, booking._id);
            const netAvailable = Math.max(0, asset.quantityAvailable - bookedQty);
            if (item.quantity > netAvailable) {
                return res.status(409).json({
                    success: false,
                    error: `Only ${netAvailable} units of "${asset.name}" available for the selected dates`
                });
            }

            const pricePerDay = asset.pricePerDay || asset.price || 0;
            const totalPrice = pricePerDay * item.quantity * durationDays;
            amount += totalPrice;

            detailedItems.push({
                assetId: asset._id,
                quantity: item.quantity,
                pricePerDay,
                totalPrice
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, error: 'Amount must be greater than zero' });
        }

        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const receipt = `addon_${bookingId}_${Date.now()}`;
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: receipt,
            notes: {
                bookingId: booking._id.toString(),
                type: 'addon'
            }
        });

        booking.addOnPayments.push({
            items: detailedItems,
            amount: amount,
            razorpayOrderId: order.id,
            status: 'pending',
            createdAt: new Date()
        });

        await booking.save();

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Create Addon Order Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
};

exports.verifyAddonPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { bookingId } = req.params;
        const { orderId, paymentId, signature } = req.body;

        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: `Add-ons are not allowed for ${booking.status} bookings` });
        }

        const crypto = require('crypto');
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (generatedSignature !== signature) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }

        const addonIndex = booking.addOnPayments.findIndex(p => p.razorpayOrderId === orderId);
        if (addonIndex === -1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Add-on payment order not found' });
        }

        const addonPayment = booking.addOnPayments[addonIndex];
        if (addonPayment.status === 'paid') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: 'Payment already processed' });
        }

        for (const item of addonPayment.items) {
            const asset = await Asset.findById(item.assetId).session(session);
            if (!asset) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ success: false, error: `Asset with ID ${item.assetId} not found` });
            }

            const bookedQty = await getBookedAssetQuantityForDates(item.assetId, booking.startDate, booking.endDate, booking._id, session);
            const netAvailable = Math.max(0, asset.quantityAvailable - bookedQty);
            if (item.quantity > netAvailable) {
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({
                    success: false,
                    error: `Only ${netAvailable} units of "${asset.name}" available for the selected dates`
                });
            }
        }

        booking.addOnPayments[addonIndex].status = 'paid';
        booking.addOnPayments[addonIndex].razorpayPaymentId = paymentId;

        for (const item of addonPayment.items) {
            const existingIndex = booking.selectedAssets.findIndex(
                a => a.assetId.toString() === item.assetId.toString()
            );
            if (existingIndex > -1) {
                booking.selectedAssets[existingIndex].quantity += item.quantity;
                booking.selectedAssets[existingIndex].totalPrice += item.totalPrice;
            } else {
                booking.selectedAssets.push({
                    assetId: item.assetId,
                    quantity: item.quantity,
                    pricePerDay: item.pricePerDay,
                    totalPrice: item.totalPrice
                });
            }
        }

        booking.totalPrice += addonPayment.amount;

        await booking.save({ session });

        const Payment = require('../models/payment-Model');
        await Payment.create([{
            booking: booking._id,
            type: 'addon',
            amount: addonPayment.amount,
            currency: 'INR',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            status: 'paid',
            paidAt: new Date(),
            metadata: {
                bookingId: booking._id.toString(),
                type: 'addon'
            }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        const User = require('../models/userModel');
        const tourist = await User.findById(booking.tourist).select('name email');
        const sendEmail = require('../utils/sendEmail');
        
        await sendEmail({
            email: tourist.email,
            subject: `GullyGuide - Add-on Purchase Successful`,
            message: `Hi ${tourist.name},\n\nYour payment of ₹${addonPayment.amount} for extra rental items on booking ${booking._id} has been received.\n\nThank you for using GullyGuide.`,
        }).catch(err => console.error("Error sending add-on confirmation email:", err));

        const { sendNotification } = require('../utils/notificationHelper');
        await sendNotification(
            booking.guide,
            booking.tourist,
            'payment_received',
            'Add-on Items Added',
            `Tourist added extra rental items (₹${addonPayment.amount}) to booking.`,
            booking._id,
            'Booking'
        ).catch(err => console.error("Error sending add-on notification to guide:", err));

        res.status(200).json({
            success: true,
            message: 'Add-on payment verified and items added successfully',
            bookingId: booking._id
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Verify Addon Payment Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
};

