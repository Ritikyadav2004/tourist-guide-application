const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');
const {
    createPaymentOrder,
    verifyPayment,
    refundPayment,
    getPaymentHistory,
    webhook,
    getUserPayments,
    getGuideEarningsAnalytics,
    getAdminPaymentAnalytics,
    updatePaymentStatus
} = require('../controller/paymentController');

// Webhook (no auth, public)
router.post('/webhook', webhook);

// Authenticated routes
router.post('/create-order', isAuthenticated, createPaymentOrder);
router.post('/verify', isAuthenticated, verifyPayment);
router.post('/refund/:bookingId', isAuthenticated, authorizeRoles('guide', 'admin'), refundPayment);
router.get('/history', isAuthenticated, getPaymentHistory);

// Payment Management System Dashboard Endpoints
router.get('/user', isAuthenticated, authorizeRoles('tourist', 'admin'), getUserPayments);
router.get('/guide/analytics', isAuthenticated, authorizeRoles('guide', 'admin'), getGuideEarningsAnalytics);
router.get('/admin/analytics', isAuthenticated, authorizeRoles('admin'), getAdminPaymentAnalytics);
router.put('/:paymentId/status', isAuthenticated, authorizeRoles('admin'), updatePaymentStatus);



module.exports = router;