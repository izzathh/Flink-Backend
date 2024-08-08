const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const checkAuth = require("../middlewares/checkAuth");
const { scheduleCronsForArchive } = require("../controllers/cron.controller");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");

router
    .route("/admin/run-cron")
    .all(checkAdmin)
    .all(checkIsSuperAdmin)
    .post(scheduleCronsForArchive);

module.exports = router;