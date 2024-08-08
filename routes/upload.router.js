const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");
const { getSignedUrl } = require("../controllers/upload.controller");

router
  .route("/get-signed-url")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .post(getSignedUrl);

module.exports = router;
