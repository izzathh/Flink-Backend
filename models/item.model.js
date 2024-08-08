const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema(
  {
    itemCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please enter a valid category name"],
    },
    itemWrapper: {
      type: Schema.Types.ObjectId,
      ref: "ItemWrapper",
      required: [true, "Please enter a valid item wrapper id"],
    },
    itemName: {
      type: String,
      required: [true, "Please enter a valid item name"],
    },
    itemSerialNumber: {
      type: Number,
      index: true
    },
    isBrandOrQuality: {
      type: Boolean,
      required: [true, "Please choose the brand/quality"],
    },
    itemBrandOrQuality: {
      itemPhoto: { type: String },
      brandOrQualityName: {
        type: String,
        // required: [true, "Please enter a valid brand/quality name"],
      },
      buyingPrice: {
        type: Number,
        // min: 1,
        // required: [true, "Please enter a valid price"],
      },
      description: {
        type: String
      },
      adminNote: {
        type: String
      },
      price: {
        type: Number,
        // min: 1,
        // required: [true, "Please enter a valid price"],
      },
      unit: {
        type: String,
        // required: [true, "Please enter a valid unit"],
      },
      itemUnitCoefficient: {
        type: Number,
        min: 1,
        // required: [true, "Please enter a valid unit coefficient"],
      },
      acceptDecimal: {
        type: Boolean,
      },
      minimumQuantity: {
        type: String,
      },
    },

    itemPhoto: { type: String },
    description: {
      type: String
    },
    adminNote: {
      type: String
    },
    buyingPrice: {
      type: Number,
      // min: 1,
    },
    price: {
      type: Number,
      // min: 1,
    },
    unit: {
      type: String,
    },
    acceptDecimal: {
      type: Boolean,
    },
    minimumQuantity: {
      type: String,
    },
    itemUnitCoefficient: { type: Number },
    archive: { type: Boolean },
    createdAdminId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", ItemSchema);
