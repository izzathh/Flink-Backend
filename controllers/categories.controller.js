const Category = require("../models/category.model");
const Counter = require("../models/counter.model");
const { BadRequest } = require("../utils/errors");

const getAllCategories = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const categories = await Category.find({ createdAdminId: adminId }).select(
      "-__v"
    );
    return res
      .status(200)
      .json({ message: "fetched all categories", categories });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addNewCategory = async (req, res, next) => {
  try {
    const { categoryName } = req.body;
    const adminId = req.headers.adminid || "";
    const allCategories = await Category.find({
      createdAdminId: adminId,
    }).select("-__v");

    const getExistingCategory = allCategories.filter(category => category.categoryName === categoryName)

    if (getExistingCategory.length >= 1) {
      throw new BadRequest(
        "This category is already added"
      );
    }

    const counters = await Counter.find({ createdAdminId: adminId }).select(
      "-__v"
    );
    let serialNumber;
    if (allCategories.length > 0) {
      serialNumber = allCategories.length + 1;
    } else {
      serialNumber = 1;
    }
    if (counters.length > 0) {
      const query = { _id: counters[0]._id };
      const update = {
        $set: {
          serialNumber: serialNumber,
        },
      };
      const options = { new: false, useFindAndModify: false };
      await Counter.findOneAndUpdate(query, update, options);
    } else {
      const newCounter = await new Counter({
        serialNumber: 1,
        createdAdminId: adminId,
      });
      await newCounter.save();
    }
    const newCategory = new Category({
      categoryName,
      serialNumber,
      createdAdminId: adminId,
    });
    const savedCategory = await newCategory.save();
    res.status(201).json({ category: savedCategory });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { getAllCategories, addNewCategory };
