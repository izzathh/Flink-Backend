const Admin = require("../models/admin.model");
const { BadRequest } = require("../utils/errors");

const changeCeoEmailAddress = async (req, res, next) => {
  try {
    const { userId, email } = req.body;
    const ceo = await Admin.findById(userId);

    if (!ceo) {
      throw new BadRequest("This account des not exist");
    }

    if (ceo.adminType !== "ceo") {
      throw new BadRequest("This account is not a ceo account");
    }

    ceo.email = email;

    const updatedCeo = await ceo.save();
    return res
      .status(200)
      .json({
        message: "changed ceo email",
        ceo: { ...updatedCeo, password: undefined },
      });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { changeCeoEmailAddress };
