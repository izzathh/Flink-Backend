const express = require("express");
const router = express.Router();
const { addNewItemWrapper } = require("../controllers/itemWrapper.controller");
const checkAdmin = require("../middlewares/checkAdmin");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");

router
  .route("/admin/add-new-item-wrapper")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(addNewItemWrapper);

module.exports = router;
