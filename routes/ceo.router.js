const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const { changeCeoEmailAddress } = require("../controllers/ceo.controller");

router.route("/change-email").all(checkAdmin).post(changeCeoEmailAddress);

module.exports = router;
