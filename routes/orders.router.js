const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const {
  placeAnOrder,
  getAllOrders,
  deleteOrder,
  getOrders,
  getMyOrders,
  getOrderedItems,
  editOrders,
  getTodaysOrders,
  getTodaysOrderedItems,
  getArchivedOrders,
  getArchivedOrderedItems,
  getArchivedOrdersDates,
} = require("../controllers/orders.controller");
const checkAuth = require("../middlewares/checkAuth");
const {
  checkIsSuperAdmin,
  checkIsSuperOrPrintingAdmin,
} = require("../middlewares/checkRole");

router
  .route("/admin/get-orders")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getAllOrders);
router
  .route("/admin/:orderId/delete-order")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .delete(deleteOrder);

router
  .route("/admin/get-orders-list")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .get(getOrders);

router
  .route("/admin/get-today-orders-list")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .get(getTodaysOrders);

router
  .route("/admin/edit-orders-list")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .post(editOrders);

router
  .route("/admin/get-archived-orders-dates")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getArchivedOrdersDates);

router
  .route("/admin/get-ordered-items")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .get(getOrderedItems);

router
  .route("/admin/get-today-ordered-items")
  .all(checkAdmin)
  .all(checkIsSuperOrPrintingAdmin)
  .get(getTodaysOrderedItems);

router
  .route("/admin/get-archived-ordered-items")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getArchivedOrderedItems);

router.route("/user/place-order").all(checkAuth).post(placeAnOrder);
router.route("/user/get-my-orders").all(checkAuth).post(getMyOrders);
router.route("/user/:orderId/delete-order").all(checkAuth).delete(deleteOrder);
module.exports = router;
