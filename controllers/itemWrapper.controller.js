const ItemWrapper = require("../models/itemWrapper.model");
const Category = require("../models/category.model");
const { ValidationError, BadRequest } = require("../utils/errors");

const addNewItemWrapper = async (req, res, next) => {
  try {
    const { itemName, categoryId } = req.body;
    const adminId = req.headers.adminid || "";
    if (!itemName || !categoryId) {
      throw new ValidationError("please enter mandatory fields");
    }
    const foundCategory = await Category.findById(categoryId).select("-__v");
    if (!foundCategory) {
      throw new BadRequest("category not found");
    }

    const newItemWrapper = await new ItemWrapper({
      itemName,
      items: [],
      createdAdminId: adminId,
    });

    foundCategory.itemsWrapper.push(newItemWrapper._id);
    await foundCategory.save();
    const updatedItemWrapper = await newItemWrapper.save();

    return res.status(200).json({
      message: "added new item wrapper",
      itemWrapper: updatedItemWrapper,
      category: foundCategory,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { addNewItemWrapper };
