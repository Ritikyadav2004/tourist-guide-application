const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const {
  getGuideEarnings,
  getGuideBookingEarnings,
} = require('../controller/guideController');

// ============================================
// GUIDE EARNINGS ROUTES
// ============================================

// GET /api/guide/earnings - Dashboard stats (total, pending, recent)
router.get(
  '/earnings',
  isAuthenticatedUser,
  authorizeRoles('guide'),
  getGuideEarnings
);

// GET /api/guide/earnings/bookings - Detailed per-booking earnings (with pagination)
router.get(
  '/earnings/bookings',
  isAuthenticatedUser,
  authorizeRoles('guide'),
  getGuideBookingEarnings
);

module.exports = router;