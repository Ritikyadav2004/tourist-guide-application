const express = require("express");
const {
  registerUser,
  verifyOtp,
  loginUser,
  firebaseAuth,
  logoutUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  getUserDetails,
  updateProfile,
  getAllGuides,
  getAdminUsers,
  updateUserBlockStatus,
  resendOtp,
} = require("../controller/userController");

const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");
const { uploadAvatar } = require("../middlewares/upload");


const router = express.Router();

/* ================= AUTH ================= */
 router.post("/register", uploadAvatar.single("avatar"), registerUser);

router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.post("/firebase-auth", firebaseAuth);
router.get("/logout", isAuthenticated, logoutUser);

/* ============ PASSWORD ================== */
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);

/* ============ GUIDE SEARCH ================= */
router.get("/guides", getAllGuides);

/* ============ ADMIN ================= */
router.get("/admin/users", isAuthenticated, authorizeRoles("admin"), getAdminUsers);
router.put("/admin/users/:userId/block", isAuthenticated, authorizeRoles("admin"), updateUserBlockStatus);

/* ============ USER PROFILE ============== */
router.get("/me", isAuthenticated, getUserDetails);
router.put("/me/update", isAuthenticated, uploadAvatar.single('avatar'), updateProfile);

/* ============ SAVED POSTS / ITINERARY ============ */
const { savePost, unsavePost, getSavedPosts } = require("../controller/postController");
router.post("/save-post/:postId", isAuthenticated, savePost);
router.put("/save-post/:postId", isAuthenticated, savePost);
router.post("/unsave-post/:postId", isAuthenticated, unsavePost);
router.put("/unsave-post/:postId", isAuthenticated, unsavePost);
router.delete("/unsave-post/:postId", isAuthenticated, unsavePost);
router.get("/saved-posts", isAuthenticated, getSavedPosts);

module.exports = router;
