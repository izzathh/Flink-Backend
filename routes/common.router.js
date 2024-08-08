const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const checkAuth = require("../middlewares/checkAuth");
const {
  modifyCurrency,
  getAllCommonFields,
  modifyMinimumOrderAmount,
  modifyNoticeText,
  modifyServiceHours,
  modifyContactDetails,
  addDeliveryHours,
  autoArchiveTime,
  modifyAccountNumber,
  modifyDeliveryCharge,
  addAreaOfOperation
} = require("../controllers/common.controller");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");

router
  .route("/admin/modify-currency")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyCurrency);


router
  .route("/admin/modify-account-number")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyAccountNumber);

router
  .route("/admin/modify-delivery-charge")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyDeliveryCharge);

router
  .route("/admin/get-common-fields")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getAllCommonFields);

router.route("/user/get-common-fields").all(checkAuth).get(getAllCommonFields);

router.route("/user/public/get-common-fields").get(getAllCommonFields);

router
  .route("/admin/modify-minimum-order-amount")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyMinimumOrderAmount);

router
  .route("/admin/modify-notice-text")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyNoticeText);

router
  .route("/admin/modify-service-hours")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyServiceHours);

router
  .route("/admin/modify-contact-details")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(modifyContactDetails);

router
  .route("/admin/time-zone")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(addDeliveryHours);

router
  .route("/admin/auto-archive-time")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(autoArchiveTime);

router
  .route("/admin/add-operation-area")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(addAreaOfOperation);

module.exports = router;
