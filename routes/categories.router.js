const express = require("express");
const checkAdmin = require("../middlewares/checkAdmin");
const {
  getAllCategories,
  addNewCategory,
} = require("../controllers/categories.controller");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");
const router = express.Router();

router
  .route("/admin/get-categories")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getAllCategories);
router
  .route("/admin/add-new-category")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(addNewCategory);

module.exports = router;
