const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true,
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true,
    },
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    guideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    paymentId: {
        type: String,
        index: true,
    },
    transactionId: {
        type: String,
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'successful', 'failed', 'refunded'],
        default: 'pending',
        index: true,
    },
    type: {
        type: String,
        enum: ['deposit', 'final', 'refund', 'full', 'addon'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    razorpayOrderId: {
        type: String,
        required: true,
    },
    razorpayPaymentId: {
        type: String,
    },
    status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
        default: 'created',
    },
    paymentMethod: {
        type: String, // e.g., 'card', 'upi', 'netbanking'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // extra info from Razorpay
    },
    paidAt: {
        type: Date,
    },
    failureReason: {
        type: String,
    },
}, { timestamps: true });

// Pre-save hook to ensure transactionId is set
paymentSchema.pre('save', function () {
    if (!this.transactionId) {
        this.transactionId = this.razorpayPaymentId || `LEGACY-${this._id.toString().slice(-10).toUpperCase()}`;
    }
});

// Indexes for faster queries
paymentSchema.index({ booking: 1, type: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);