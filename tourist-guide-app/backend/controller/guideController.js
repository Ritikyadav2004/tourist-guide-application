const Booking = require('../models/booking-Model');
const User = require('../models/userModel');
const Payment = require('../models/payment-Model');

// ============================================
// @desc    Get guide earnings dashboard data
// @route   GET /api/guide/earnings
// @access  Private (Guide only)
// ============================================
exports.getGuideEarnings = async (req, res) => {
  try {
    const guideId = req.user.id;

    // --- 1. Verify the user is actually a guide ---
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted. Only guides can view earnings.',
      });
    }

    // --- 2. Total Earned (from COMPLETED bookings) ---
    const completedBookings = await Booking.find({
      guide: guideId,
      status: 'completed',
    }).select('totalPrice');

    const totalEarned = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // --- 3. Pending Payout (from CONFIRMED + PENDING bookings) ---
    const pendingBookings = await Booking.find({
      guide: guideId,
      status: { $in: ['confirmed', 'pending'] },
    }).select('totalPrice');

    const pendingPayout = pendingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // --- 4. Completed Trips Count ---
    const completedTrips = completedBookings.length;

    // --- 5. Recent Transactions (last 5 completed bookings) ---
    const recent = await Booking.find({
      guide: guideId,
      status: 'completed',
    })
      .populate('tourist', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('tourist totalPrice createdAt status startDate endDate');

    const recentBookings = recent.map((b) => ({
      tourist: b.tourist?.name || 'Guest',
      touristEmail: b.tourist?.email || '',
      amount: b.totalPrice,
      date: b.createdAt,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
    }));

    // --- 6. (Optional) Total Deposits vs Final Payments breakdown ---
    // Aggregate payments by type for this guide's bookings
    const paymentStats = await Payment.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'bookingData',
        },
      },
      { $unwind: '$bookingData' },
      {
        $match: {
          'bookingData.guide': guideId,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const depositTotal = paymentStats.find((p) => p._id === 'deposit')?.total || 0;
    const finalTotal = paymentStats.find((p) => p._id === 'final')?.total || 0;

    // --- 7. Send Response ---
    res.status(200).json({
      success: true,
      totalEarned,
      pendingPayout,
      completedTrips,
      depositTotal,
      finalTotal,
      recentBookings,
    });
  } catch (error) {
    console.error('Guide earnings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch earnings.',
    });
  }
};

// ============================================
// @desc    Get earnings breakdown per booking
// @route   GET /api/guide/earnings/bookings
// @access  Private (Guide only)
// ============================================
exports.getGuideBookingEarnings = async (req, res) => {
  try {
    const guideId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find({
      guide: guideId,
      status: { $in: ['completed', 'confirmed'] },
    })
      .populate('tourist', 'name email')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('tourist post totalPrice startDate endDate status createdAt');

    const total = await Booking.countDocuments({
      guide: guideId,
      status: { $in: ['completed', 'confirmed'] },
    });

    res.status(200).json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b._id,
        tourist: b.tourist?.name || 'Guest',
        postTitle: b.post?.title || 'Untitled',
        totalPrice: b.totalPrice,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        createdAt: b.createdAt,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Guide booking earnings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch booking earnings.',
    });
  }
};