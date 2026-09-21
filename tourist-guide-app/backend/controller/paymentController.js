const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/booking-Model');
const FinalBill = require('../models/finalBill-Model');
const Payment = require('../models/payment-Model');
const Refund = require('../models/refund-Model');
const User = require('../models/userModel');
const { sendNotification, NotificationTemplates } = require('../utils/notificationHelper');
const sendEmail = require('../utils/sendEmail');
const { autoGenerateFinalBill } = require('./finalBillController');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================
// 1. CREATE ORDER (Deposit or Final)
// ============================
exports.createPaymentOrder = async (req, res) => {
    try {
        const { bookingId, type } = req.body; // type: 'deposit' or 'final'
        const booking = await Booking.findById(bookingId)
            .populate('tourist', 'name email')
            .populate('guide', 'name email')
            .populate('post', 'title');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'This booking has been cancelled and cannot accept payment.' });
        }

        // Authorization: only tourist or guide? Usually tourist initiates payment.
        // We'll allow the tourist (who is the payer) and admin.
        if (req.user.role !== 'admin' && booking.tourist._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to pay for this booking' });
        }

        // Determine amount
        let amount = 0;
        let receipt = `booking_${bookingId}`;
        let notes = {};

        if (type === 'deposit') {
            // Deposit is 20% of total price
            amount = Math.round(booking.totalPrice * 0.2 * 100); // in paise
            notes.purpose = 'Deposit for booking';
            booking.depositAmount = amount / 100;
            booking.paymentStatus = 'deposit_pending';
        } else if (type === 'final') {
            // Final payment is remaining amount (from FinalBill)
            let finalBill = await FinalBill.findOne({ booking: bookingId });
            if (!finalBill) {
                finalBill = await autoGenerateFinalBill(bookingId);
            }
            if (!finalBill) {
                return res.status(404).json({ success: false, message: 'Final bill not generated yet' });
            }
            const addOnTotalPaid = booking.addOnPayments
                ? booking.addOnPayments
                    .filter((p) => p.status === 'paid')
                    .reduce((sum, p) => sum + p.amount, 0)
                : 0;
            const totalPaid = (booking.depositAmount || 0) + addOnTotalPaid;
            const remaining = finalBill.totalAmount - totalPaid;
            if (remaining <= 0) {
                return res.status(400).json({ success: false, message: 'No remaining amount to pay' });
            }
            amount = Math.round(remaining * 100);
            notes.purpose = 'Final balance for booking';
            booking.finalAmount = remaining;
            booking.paymentStatus = 'final_pending';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
        }

        // Create Razorpay Order
        const orderOptions = {
            amount: amount,
            currency: 'INR',
            receipt: receipt,
            notes: {
                bookingId: booking._id.toString(),
                touristEmail: booking.tourist.email,
                guideName: booking.guide.name,
                postTitle: booking.post.title,
                type: type,
            },
        };

        const order = await razorpay.orders.create(orderOptions);

        // Save order ID in booking
        booking.razorpayOrderId = order.id;
        await booking.save();

        // Save payment record for audit
        await Payment.create({
            booking: booking._id,
            type,
            amount: amount / 100,
            currency: 'INR',
            razorpayOrderId: order.id,
            status: 'created',
            metadata: {
                bookingId: booking._id.toString(),
                type,
            }
        });

        // Return order details to frontend
        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            bookingId: booking._id,
            type: type,
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================
// 2. VERIFY PAYMENT (frontend callback)
// ============================
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, bookingId } = req.body;

        // Find booking first to check status
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'This booking has been cancelled and cannot accept payment.' });
        }

        // Generate signature to verify
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (generatedSignature !== signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        if (booking.razorpayOrderId !== orderId) {
            return res.status(400).json({ success: false, message: 'Order ID does not match booking' });
        }

        let updateFields = {
            razorpayPaymentId: paymentId,
            paymentCompletedAt: new Date(),
        };

        let paymentType = 'Deposit';
        if (booking.paymentStatus === 'deposit_pending') {
            updateFields.paymentStatus = 'deposit_paid';
            paymentType = 'Deposit';
            await autoGenerateFinalBill(bookingId);
        } else if (booking.paymentStatus === 'final_pending') {
            updateFields.paymentStatus = 'fully_paid';
            paymentType = 'Final';
            await FinalBill.findOneAndUpdate({ booking: bookingId }, { status: 'paid' });
        } else {
            return res.status(400).json({ success: false, message: 'Booking is not awaiting payment' });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateFields, { new: true });

        await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId },
            {
                razorpayPaymentId: paymentId,
                status: 'paid',
                paidAt: new Date(),
                paymentMethod: req.body.method || null,
            },
            { returnDocument: 'after' }
        );

        const tourist = await User.findById(booking.tourist).select('name email');
        const amountPaid = paymentType === 'Deposit' ? updatedBooking.depositAmount : updatedBooking.finalAmount;

        await sendEmail({
            email: tourist.email,
            subject: `GullyGuide - ${paymentType} Payment Successful`,
            message: `Hi ${tourist.name},\n\nYour ${paymentType} payment of ₹${amountPaid} for booking ${booking._id} has been received.\n\nThank you for using GullyGuide.`,
        });

        await sendNotification(
            booking.guide,
            booking.tourist,
            'payment_received',
            'Payment Received',
            `${paymentType} payment of ₹${amountPaid} received from tourist.`,
            booking._id,
            'Booking'
        );

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            bookingId: bookingId,
            paymentStatus: updatedBooking.paymentStatus,
        });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================
// 3. REFUND PAYMENT
// ============================
exports.refundPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { amount, reason } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('tourist', 'name email')
            .populate('guide', 'name email');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (req.user.role === 'guide' && booking.guide._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to refund this booking' });
        }

        if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'deposit_pending' || booking.paymentStatus === 'final_pending') {
            return res.status(400).json({ success: false, message: 'Booking payment is not completed yet' });
        }

        if (booking.paymentStatus === 'refunded') {
            return res.status(400).json({ success: false, message: 'Booking has already been refunded' });
        }

        const paymentRecord = await Payment.findOne({ booking: bookingId, status: 'paid' }).sort({ createdAt: -1 });
        if (!paymentRecord || !paymentRecord.razorpayPaymentId) {
            return res.status(400).json({ success: false, message: 'No paid payment record available to refund' });
        }

        const refundAmount = amount === undefined || amount === null ? paymentRecord.amount : Number(amount);
        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Refund amount must be a positive number' });
        }

        if (refundAmount > paymentRecord.amount) {
            return res.status(400).json({ success: false, message: 'Refund amount cannot exceed paid amount' });
        }

        const refundResponse = await razorpay.payments.refund(paymentRecord.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100),
        });

        const refundRecord = await Refund.create({
            booking: booking._id,
            payment: paymentRecord._id,
            user: req.user._id,
            amount: refundAmount,
            currency: 'INR',
            razorpayPaymentId: paymentRecord.razorpayPaymentId,
            razorpayRefundId: refundResponse.id,
            status: refundResponse.status,
            reason: reason || 'Refund processed by guide/admin',
            metadata: refundResponse,
        });

        paymentRecord.status = 'refunded';
        await paymentRecord.save();

        booking.paymentStatus = 'refunded';
        await booking.save();

        res.status(200).json({ success: true, message: 'Refund processed successfully', refund: refundRecord });
    } catch (error) {
        console.error('Refund Payment Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================
// 4. PAYMENT HISTORY
// ============================
exports.getPaymentHistory = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const userId = new mongoose.Types.ObjectId(req.user._id);
        const match = {};

        if (req.user.role === 'tourist') {
            match['booking.tourist'] = userId;
        } else if (req.user.role === 'guide') {
            match['booking.guide'] = userId;
        }

        const pipeline = [
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking',
                    foreignField: '_id',
                    as: 'booking'
                }
            },
            { $unwind: '$booking' },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'booking.post',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
        ];

        if (Object.keys(match).length) {
            pipeline.push({ $match: match });
        }

        pipeline.push(
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 1,
                                bookingId: '$booking._id',
                                bookingTitle: { $ifNull: ['$post.title', 'Unknown'] },
                                amount: '$amount',
                                paymentType: '$type',
                                status: '$status',
                                date: '$createdAt'
                            }
                        }
                    ]
                }
            }
        );

        const result = await Payment.aggregate(pipeline);
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
        const history = result[0].data;

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            history,
        });
    } catch (error) {
        console.error('Get Payment History Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================
// 5. WEBHOOK HANDLER
// ============================
exports.webhook = async (req, res) => {
    try {
        // Verify webhook signature (if you have secret)
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        const webhookBody = req.rawBody || JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(webhookBody)
            .digest('hex');

        if (!webhookSecret) {
            return res.status(500).json({ success: false, message: 'Webhook secret is not configured' });
        }

        if (signature !== expectedSignature) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const event = req.body;
        // Handle payment.captured event
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id;

            // Find booking by orderId
            const booking = await Booking.findOne({ razorpayOrderId: orderId });
            if (!booking) {
                console.log('Booking not found for orderId:', orderId);
                return res.status(200).json({ success: true }); // Still return 200 to avoid retry
            }

            const paymentRecord = await Payment.findOne({ razorpayOrderId: orderId });
            if (paymentRecord && paymentRecord.status === 'paid') {
                return res.status(200).json({ success: true });
            }

            // Update booking
            let updateFields = {
                razorpayPaymentId: paymentId,
                paymentCompletedAt: new Date(),
            };

            if (booking.paymentStatus === 'deposit_pending') {
                updateFields.paymentStatus = 'deposit_paid';
                await autoGenerateFinalBill(booking._id);
            } else if (booking.paymentStatus === 'final_pending') {
                updateFields.paymentStatus = 'fully_paid';
                await FinalBill.findOneAndUpdate(
                    { booking: booking._id },
                    { status: 'paid' }
                );
            } else {
                return res.status(200).json({ success: true });
            }

            await Booking.findByIdAndUpdate(booking._id, updateFields);

            if (paymentRecord) {
                await Payment.findByIdAndUpdate(paymentRecord._id, {
                    razorpayPaymentId: paymentId,
                    status: 'paid',
                    paidAt: new Date(),
                });
            }

            console.log(`Webhook: Payment ${paymentId} for booking ${booking._id} updated.`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        // Always return 200 to avoid retries from Razorpay
        res.status(200).json({ success: false, message: error.message });
    }
};

// ============================================
// 6. GET USER PAYMENTS (Tourist view)
// ============================================
exports.getUserPayments = async (req, res) => {
    try {
        const touristId = req.user._id;

        // Fetch bookings for this tourist
        const bookings = await Booking.find({ tourist: touristId })
            .populate('guide', 'name email')
            .populate('post', 'title')
            .sort({ createdAt: -1 });

        // Fetch payments for this tourist
        const payments = await Payment.find({ touristId })
            .populate({
                path: 'booking',
                populate: [
                    { path: 'guide', select: 'name' },
                    { path: 'post', select: 'title' }
                ]
            })
            .sort({ createdAt: -1 });

        // Calculate stats
        const totalBookings = bookings.length;
        let totalPaymentsMade = 0;
        let successfulCount = 0;
        let pendingCount = 0;
        let failedCount = 0;

        payments.forEach(p => {
            if (p.status === 'paid') {
                totalPaymentsMade += p.amount;
                successfulCount++;
            } else if (p.status === 'created' || p.status === 'attempted') {
                pendingCount++;
            } else if (p.status === 'failed') {
                failedCount++;
            }
        });

        // Format history
        const history = payments.map(p => {
            return {
                _id: p._id,
                transactionId: p.razorpayPaymentId || p.transactionId || p._id.toString().slice(-8).toUpperCase(),
                tourTitle: p.booking?.post?.title || 'Custom Tour',
                guideName: p.booking?.guide?.name || 'Guide',
                amount: p.amount,
                type: p.type,
                paymentMethod: p.paymentMethod || 'Razorpay',
                paymentStatus: p.status === 'paid' ? 'successful' : p.status,
                createdAt: p.createdAt
            };
        });

        // Format bookingsHistory
        const bookingsHistory = bookings.map(b => {
            return {
                _id: b._id,
                tourTitle: b.post?.title || 'Custom Tour',
                guideName: b.guide?.name || 'Guide',
                totalPrice: b.totalPrice,
                status: b.status,
                startDate: b.startDate,
                endDate: b.endDate,
                createdAt: b.createdAt
            };
        });

        // Format charts data (last 6 months or all months in data)
        // paymentStatusDistribution
        const paymentStatusDistribution = [
            { name: 'Successful', value: successfulCount },
            { name: 'Pending', value: pendingCount },
            { name: 'Failed', value: failedCount },
            { name: 'Refunded', value: payments.filter(p => p.status === 'refunded').length }
        ];

        // Monthly Payments (expenditures per month)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyPaymentsMap = {};
        const bookingVsPaymentTrendsMap = {};

        // Initialize maps with default 6 months or dynamic
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mLabel = monthNames[d.getMonth()];
            monthlyPaymentsMap[mLabel] = 0;
            bookingVsPaymentTrendsMap[mLabel] = { month: mLabel, bookings: 0, payments: 0 };
        }

        payments.forEach(p => {
            if (p.status === 'paid') {
                const date = new Date(p.createdAt);
                const mLabel = monthNames[date.getMonth()];
                if (monthlyPaymentsMap[mLabel] !== undefined) {
                    monthlyPaymentsMap[mLabel] += p.amount;
                }
                if (bookingVsPaymentTrendsMap[mLabel] !== undefined) {
                    bookingVsPaymentTrendsMap[mLabel].payments += p.amount;
                }
            }
        });

        bookings.forEach(b => {
            const date = new Date(b.createdAt);
            const mLabel = monthNames[date.getMonth()];
            if (bookingVsPaymentTrendsMap[mLabel] !== undefined) {
                bookingVsPaymentTrendsMap[mLabel].bookings += 1;
            }
        });

        const monthlyPayments = Object.keys(monthlyPaymentsMap).map(m => ({
            month: m,
            amount: monthlyPaymentsMap[m]
        }));

        const bookingVsPaymentTrends = Object.values(bookingVsPaymentTrendsMap);

        const charts = {
            paymentStatusDistribution,
            monthlyPayments,
            bookingVsPaymentTrends
        };

        res.status(200).json({
            success: true,
            userPayments: {
                stats: {
                    totalBookings,
                    totalPaymentsMade,
                    successfulCount,
                    pendingCount,
                    failedCount
                },
                history,
                bookingsHistory,
                charts
            }
        });
    } catch (error) {
        console.error('getUserPayments Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================================
// 7. GET GUIDE EARNINGS ANALYTICS (Guide view)
// ============================================
exports.getGuideEarningsAnalytics = async (req, res) => {
    try {
        const guideId = req.user._id;

        // Bookings for this guide
        const bookings = await Booking.find({ guide: guideId })
            .populate('tourist', 'name email')
            .populate('post', 'title')
            .sort({ createdAt: -1 });

        // Payments where guideId matches
        const payments = await Payment.find({ guideId })
            .populate({
                path: 'booking',
                populate: { path: 'tourist', select: 'name' }
            })
            .sort({ createdAt: -1 });

        // Stats calculations
        const totalBookingsReceived = bookings.length;
        let earningsFromOwnBookings = 0;
        let pendingEarnings = 0;
        let successfulPayments = 0;

        // Calculate guide earnings
        bookings.forEach(b => {
            if (b.status === 'confirmed' || b.status === 'completed') {
                if (b.paymentStatus === 'fully_paid') {
                    earningsFromOwnBookings += b.totalPrice;
                } else if (b.paymentStatus === 'deposit_paid') {
                    earningsFromOwnBookings += b.depositAmount;
                    pendingEarnings += b.finalAmount;
                }
            }
        });

        payments.forEach(p => {
            if (p.status === 'paid') {
                successfulPayments++;
            }
        });

        const formattedPayments = payments.map(p => {
            return {
                _id: p._id,
                transactionId: p.razorpayPaymentId || p.transactionId || p._id.toString().slice(-8).toUpperCase(),
                touristName: p.booking?.tourist?.name || 'Tourist',
                amount: p.amount,
                type: p.type,
                paymentStatus: p.status === 'paid' ? 'successful' : p.status,
                createdAt: p.createdAt
            };
        });

        const bookingsHistory = bookings.map(b => {
            return {
                _id: b._id,
                touristName: b.tourist?.name || 'Tourist',
                tourTitle: b.post?.title || 'Custom Tour',
                totalPrice: b.totalPrice,
                status: b.status,
                startDate: b.startDate,
                endDate: b.endDate,
                createdAt: b.createdAt
            };
        });

        // Charts
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyEarningsMap = {};
        const revenueTrendMap = {};
        const bookingStatusMap = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mLabel = monthNames[d.getMonth()];
            monthlyEarningsMap[mLabel] = 0;
            revenueTrendMap[mLabel] = 0;
        }

        bookings.forEach(b => {
            if (bookingStatusMap[b.status] !== undefined) {
                bookingStatusMap[b.status]++;
            }
            // Earnings mapped by month
            if (b.status === 'confirmed' || b.status === 'completed') {
                const date = new Date(b.createdAt);
                const mLabel = monthNames[date.getMonth()];
                const earned = b.paymentStatus === 'fully_paid' ? b.totalPrice : (b.paymentStatus === 'deposit_paid' ? b.depositAmount : 0);
                if (monthlyEarningsMap[mLabel] !== undefined) {
                    monthlyEarningsMap[mLabel] += earned;
                }
            }
        });

        // Calculate cumulative revenue
        let cumulative = 0;
        const revenueTrend = Object.keys(monthlyEarningsMap).map(m => {
            cumulative += monthlyEarningsMap[m];
            return { month: m, revenue: cumulative };
        });

        const monthlyEarnings = Object.keys(monthlyEarningsMap).map(m => ({
            month: m,
            earnings: monthlyEarningsMap[m]
        }));

        const bookingStatusOverview = Object.keys(bookingStatusMap).map(statusName => ({
            name: statusName.toUpperCase(),
            value: bookingStatusMap[statusName]
        }));

        const charts = {
            monthlyEarnings,
            bookingStatusOverview,
            revenueTrend
        };

        res.status(200).json({
            success: true,
            guideAnalytics: {
                stats: {
                    totalBookingsReceived,
                    earningsFromOwnBookings,
                    pendingEarnings,
                    successfulPayments
                },
                payments: formattedPayments,
                bookingsHistory,
                charts
            }
        });
    } catch (error) {
        console.error('getGuideEarningsAnalytics Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================================
// 8. GET ADMIN PAYMENT ANALYTICS (Admin view)
// ============================================
exports.getAdminPaymentAnalytics = async (req, res) => {
    try {
        const { touristId, guideId, status, startDate, endDate } = req.query;

        const query = {};
        if (touristId) query.touristId = touristId;
        if (guideId) query.guideId = guideId;
        if (status) {
            if (status === 'successful') query.status = 'paid';
            else query.status = status;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const payments = await Payment.find(query)
            .populate({
                path: 'booking',
                populate: [
                    { path: 'tourist', select: 'name email' },
                    { path: 'guide', select: 'name' },
                    { path: 'post', select: 'title' }
                ]
            })
            .sort({ createdAt: -1 });

        // Calculate stats
        let totalRevenue = 0;
        let totalSuccessfulPayments = 0;
        let totalPendingPayments = 0;
        let totalFailedPayments = 0;
        let totalRefunds = 0;
        let totalRefundsAmount = 0;

        payments.forEach(p => {
            if (p.status === 'paid') {
                totalRevenue += p.amount;
                totalSuccessfulPayments++;
            } else if (p.status === 'created' || p.status === 'attempted') {
                totalPendingPayments++;
            } else if (p.status === 'failed') {
                totalFailedPayments++;
            } else if (p.status === 'refunded') {
                totalRefunds++;
                totalRefundsAmount += p.amount;
            }
        });

        const formattedPayments = payments.map(p => {
            return {
                _id: p._id,
                transactionId: p.razorpayPaymentId || p.transactionId || p._id.toString().slice(-8).toUpperCase(),
                touristName: p.booking?.tourist?.name || 'Tourist',
                touristEmail: p.booking?.tourist?.email || '',
                guideName: p.booking?.guide?.name || 'Guide',
                tourTitle: p.booking?.post?.title || 'Custom Tour',
                amount: p.amount,
                type: p.type,
                paymentStatus: p.status === 'paid' ? 'successful' : p.status,
                createdAt: p.createdAt
            };
        });

        // Filter options (all tourists and guides for dropdowns)
        const tourists = await User.find({ role: 'tourist' }).select('name email');
        const guides = await User.find({ role: 'guide' }).select('name email');

        // Charts data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const revenueAnalyticsMap = {};
        const bookingStatusDistributionMap = { successful: totalSuccessfulPayments, pending: totalPendingPayments, failed: totalFailedPayments, refunded: totalRefunds };

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mLabel = monthNames[d.getMonth()];
            revenueAnalyticsMap[mLabel] = 0;
        }

        payments.forEach(p => {
            if (p.status === 'paid') {
                const date = new Date(p.createdAt);
                const mLabel = monthNames[date.getMonth()];
                if (revenueAnalyticsMap[mLabel] !== undefined) {
                    revenueAnalyticsMap[mLabel] += p.amount;
                }
            }
        });

        const revenueAnalytics = Object.keys(revenueAnalyticsMap).map(m => ({
            month: m,
            revenue: revenueAnalyticsMap[m]
        }));

        const paymentStatusDistribution = Object.keys(bookingStatusDistributionMap).map(name => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: bookingStatusDistributionMap[name]
        }));

        // Top earning guides
        const guideEarnings = {};
        const bookingsList = await Booking.find({ status: { $in: ['confirmed', 'completed'] } }).populate('guide', 'name');
        bookingsList.forEach(b => {
            if (b.guide) {
                const gName = b.guide.name;
                const earned = b.paymentStatus === 'fully_paid' ? b.totalPrice : (b.paymentStatus === 'deposit_paid' ? b.depositAmount : 0);
                guideEarnings[gName] = (guideEarnings[gName] || 0) + earned;
            }
        });

        const topEarningGuides = Object.keys(guideEarnings).map(name => ({
            name,
            earnings: guideEarnings[name]
        })).sort((a, b) => b.earnings - a.earnings).slice(0, 5);

        // Booking vs Revenue trends
        const bookingVsRevenueTrendsMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mLabel = monthNames[d.getMonth()];
            bookingVsRevenueTrendsMap[mLabel] = { month: mLabel, bookings: 0, revenue: 0 };
        }

        payments.forEach(p => {
            if (p.status === 'paid') {
                const date = new Date(p.createdAt);
                const mLabel = monthNames[date.getMonth()];
                if (bookingVsRevenueTrendsMap[mLabel] !== undefined) {
                    bookingVsRevenueTrendsMap[mLabel].revenue += p.amount;
                }
            }
        });

        bookingsList.forEach(b => {
            const date = new Date(b.createdAt);
            const mLabel = monthNames[date.getMonth()];
            if (bookingVsRevenueTrendsMap[mLabel] !== undefined) {
                bookingVsRevenueTrendsMap[mLabel].bookings += 1;
            }
        });

        const bookingVsRevenueTrends = Object.values(bookingVsRevenueTrendsMap);

        const charts = {
            revenueAnalytics,
            paymentStatusDistribution,
            topEarningGuides,
            bookingVsRevenueTrends
        };

        res.status(200).json({
            success: true,
            adminAnalytics: {
                stats: {
                    totalRevenue,
                    totalSuccessfulPayments,
                    totalPendingPayments,
                    totalFailedPayments,
                    totalRefunds,
                    totalRefundsAmount
                },
                payments: formattedPayments,
                filterOptions: { tourists, guides },
                charts
            }
        });
    } catch (error) {
        console.error('getAdminPaymentAnalytics Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// ============================================
// 9. UPDATE PAYMENT STATUS (Admin status change)
// ============================================
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body; // status: 'pending', 'successful', 'failed', 'refunded'

        const dbStatus = status === 'successful' ? 'paid' : status;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        payment.status = dbStatus;
        if (dbStatus === 'paid') {
            payment.paidAt = new Date();
        }
        await payment.save();

        // Update corresponding booking
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            if (dbStatus === 'paid') {
                if (payment.type === 'deposit') {
                    booking.paymentStatus = 'deposit_paid';
                } else if (payment.type === 'final' || payment.type === 'full') {
                    booking.paymentStatus = 'fully_paid';
                    await FinalBill.findOneAndUpdate({ booking: booking._id }, { status: 'paid' });
                }
            } else if (dbStatus === 'failed') {
                // If it fails, keep as pending
            } else if (dbStatus === 'refunded') {
                booking.paymentStatus = 'refunded';
            }
            await booking.save();
        }

        res.status(200).json({
            success: true,
            message: `Payment status updated to ${status} successfully`
        });
    } catch (error) {
        console.error('updatePaymentStatus Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};