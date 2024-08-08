const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const {
  getOrdersPDF,
  getOrderedItemsPDF,
  getGenerateOrderPDF,
  getArchivedOrdersPDF,
  getArchivedOrderedItemsPDF,
  getArchivedOrdersByDatePDF,
  getTodaysOrdersByDatePDF,
  getTodaysOrderesItemByDatePDF,
  getArchivedOrderedItemsByDatePDF,
} = require("../controllers/generatepdf.controller");
const {
  checkIsSuperOrPrintingAdmin,
  checkIsSuperAdmin,
  checkIsPrintingAdmin,
} = require("../middlewares/checkRole");

router
  .route("/todays-orders")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .get(getOrdersPDF);
router
  .route("/ordered-items")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .get(getOrderedItemsPDF);
router
  .route("/archived-orders")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getArchivedOrdersPDF);
router
  .route("/archived-ordered-items")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getArchivedOrderedItemsPDF);

router
  .route("/get-archived-orders-by-date")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(getArchivedOrdersByDatePDF);

router
  .route("/get-todays-orders-print-admin")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(getTodaysOrdersByDatePDF);

router
  .route("/get-archived-ordered-items-by-date")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(getArchivedOrderedItemsByDatePDF);

router
  .route("/get-generated-pdfs")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getGenerateOrderPDF)

router
  .route("/get-todays-items-print-admin")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .post(getTodaysOrderesItemByDatePDF);

module.exports = router;
