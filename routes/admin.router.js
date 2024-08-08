const express = require("express");
const router = express.Router();
const {
  checkIsSuperAdmin,
  checkIsCeoOrSuperAdmin,
  checkIsCeo,
  checkIsSalesAdmin,
} = require("../middlewares/checkRole");
const {
  registerAdmin,
  adminLogin,
  initAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  getListOfAdminsUnderSuperAdmin,
  editAdminDetails,
  deleteAdmin,
  getListOfSuperAdmins,
  editSuperAdminDetails,
  salesAdminLogin,
} = require("../controllers/admin.controller");
const checkAuth = require("../middlewares/checkAuth");
const checkAdmin = require("../middlewares/checkAdmin");

// Admin Register
router
  .route("/register-admin")
  .all(checkAuth)
  .all(checkIsCeoOrSuperAdmin)
  .post(registerAdmin);

//Admin Login
router.route("/login").post(adminLogin);

// Sales admin login
router.route("/sales-admin-login").post(salesAdminLogin);

//Init admin
router.route("/init").all(checkAdmin).post(initAdmin);

// Init Sales Admin
router
  .route("/sales-admin-init")
  .all(checkIsSalesAdmin)
  .all(checkAdmin)
  .post(initAdmin);

//Change Password
router.route("/change-password").all(checkAdmin).post(changePassword);

// Generate OTP for forgot password
router.route("/generate-otp").post(forgotPassword);

// validate OTP and reset password
router.route("/reset-password").post(resetPassword);

// Fetch all super admins
router
  .route("/get-super-admins")
  .all(checkAdmin)
  .all(checkIsCeo)
  .get(getListOfSuperAdmins);

// Fetch all admins under a super admin
router
  .route("/get-admins-list")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getListOfAdminsUnderSuperAdmin);

// Edit admin Details
router
  .route("/edit-admin-details")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(editAdminDetails);

router
  .route("/edit-super-admin-details")
  .all(checkAdmin)
  .all(checkIsCeo)
  .post(editSuperAdminDetails);

//Delete Admin
router
  .route("/:deleteAdminId/delete-admin")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .delete(deleteAdmin);

module.exports = router;
