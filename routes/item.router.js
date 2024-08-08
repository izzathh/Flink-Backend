const express = require("express");
const router = express.Router();
const multer = require('multer');

const checkAdmin = require("../middlewares/checkAdmin");
const {
  addNewItem,
  getAllItems,
  getItemNames,
  addMultipleItems,
  editItem,
  editItemWithImage,
  deleteItem,
} = require("../controllers/item.controller");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .route("/admin/add-new-item")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(upload.single('itemPhoto'), addNewItem);

router
  .route("/admin/add-multiple-items")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(upload.any(), addMultipleItems);

router
  .route("/admin/edit-item")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(editItem);
router
  .route("/admin/edit-item-with-image")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(editItemWithImage);

router
  .route("/admin/:categoryId/:itemId/:itemWrapperId/:createdAdminId/delete-item")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .delete(deleteItem);

router
  .route("/admin/get-all-items")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getAllItems);

router
  .route("/admin/get-item-names")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getItemNames);

module.exports = router;
