const express = require("express");
const router = express.Router();
const {
  registerUser,
  getAllUsers,
  editUser,
  deleteUser,
  userLogin,
  initUser,
  forgotUserPassword,
  resetUserPassword,
} = require("../controllers/user.controller");
const checkAdmin = require("../middlewares/checkAdmin");
const checkAuth = require("../middlewares/checkAuth");
const {
  checkIsSuperAdmin,
  checkIsSuperOrSalesAdmin,
} = require("../middlewares/checkRole");

//Register user - by sales/super admin
router
  .route("/admin/register-user")
  .all(checkAdmin)
  .all(checkIsSuperOrSalesAdmin)
  .post(registerUser);

// list all users created by admin
router
  .route("/admin/list-users")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getAllUsers);

//Edit a user
router
  .route("/admin/edit-user")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(editUser);

//Delete a user
router
  .route("/admin/:userId/delete-user")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .delete(deleteUser);

router.route("/user/register-user").post(registerUser);
// User Login
router.route("/user/login").post(userLogin);

// Init User
router.route("/user/init").all(checkAuth).post(initUser);

//Generate OTP
router.route("/user/generate-otp").post(forgotUserPassword);

// Reset Password
router.route("/user/reset-password").post(resetUserPassword);

module.exports = router;
