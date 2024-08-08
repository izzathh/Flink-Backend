const multer = require("multer");
const Item = require("../models/item.model");
const Category = require("../models/category.model");
const ItemWrapper = require("../models/itemWrapper.model");
const Counter = require("../models/counter.model");
const axios = require('axios');

const { ValidationError, BadRequest } = require("../utils/errors");

const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const adminModel = require("../models/admin.model");

// aws.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_KEY,
// });

// const s3 = new aws.S3({
//   region: process.env.BUCKET_REGION,
//   signatureVersion: "v4",
// });

const s3 = new aws.S3({
  accessKeyId: process.env.BACBLAZE_ACCESS_KEY,
  secretAccessKey: process.env.BACKBLAZE_SECRET_KEY,
  endpoint: process.env.BACKBLAZE_ENDPOINT,
  region: process.env.BACKBLAZE_REGION,
});

const s3Storage = (folderName) => multerS3({
  s3: s3, // s3 instance
  bucket: process.env.BACKBLAZE_BUCKET_NAME,
  acl: "public-read", // storage access type
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const folderPath = folderName + "/item-images/";
    const fileName = Date.now() + "_" + file.fieldname + "_" + file.originalname;
    const key = folderPath + fileName;
    cb(null, key);
  },
});

// const upload = multer({
//   // storage: storage,
//   storage: s3Storage,
// });

// const uploadImage = upload.single("itemPhoto");
const uploadImage = (folderName) => multer({
  storage: s3Storage(folderName),
}).single("itemPhoto");

const uploadMultipleImages = (folderName) => multer({
  storage: s3Storage(folderName),
}).array("itemPhoto");
// const uploadMultipleImages = upload.array("itemPhoto");

const addMultipleItems = async (req, res, next) => {
  try {
    // const adminId = req.headers.adminid || "";
    // const getAdminBranchName = await adminModel.findById(adminId).select("branchName")
    // const folderName = `branch-${adminId}`
    // const uploadMultipleImageMiddleware = uploadMultipleImages(folderName);
    // uploadMultipleImageMiddleware(req, res, async (err) => {
    //   if (err) {
    //     console.log("inside error", err);
    //     console.log(err);
    //   } else {
    //     if (req.files == undefined || req.files.length === 0) {
    //       res.status(404).json({
    //         success: false,
    //         message: "Please upload a file",
    //         file: `uploads/${req.file.filename}`,
    //       });
    //     } else {

    if (!req.files || req.files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No files uploaded!",
      });
    }

    const {
      itemName,
      itemWrapperId,
      itemCategory,
      isBrandOrQuality,
      itemBrandOrQuality,
      minimumQuantity,
    } = req.body;
    const adminId = req.headers.adminid || "";

    const parsedItemName = itemName;
    const parsedItemWrapperId = itemWrapperId;
    const parsedItemBrandOrQuality = JSON.parse(itemBrandOrQuality);
    const parsedItemCategory = itemCategory;
    const parsedIsBrandOrQuality = JSON.parse(isBrandOrQuality);
    console.log('parsedItemBrandOrQuality:', parsedItemBrandOrQuality);
    if (
      !parsedItemName ||
      !parsedItemWrapperId ||
      !parsedItemCategory ||
      parsedIsBrandOrQuality === undefined
    ) {
      throw new ValidationError("Please enter all mandatory fields");
    }
    if (parsedIsBrandOrQuality && parsedItemBrandOrQuality.length < 2) {
      throw new ValidationError("Please enter atleast 2 brand details");
    }

    let category = await Category.findById(parsedItemCategory).select(
      "-__v"
    );

    console.log('category:', category);
    let foundItemWrapper = await ItemWrapper.findById(
      itemWrapperId
    ).select("-__v");
    console.log('foundItemWrapper:', foundItemWrapper);


    if (!category || !foundItemWrapper) {
      throw new BadRequest("category or itemwrapper not found");
    }

    // const url = req.protocol + "://" + req.get("host");

    let itemsCount = await Item.find({
      createdAdminId: adminId,
      itemCategory: parsedItemCategory
    }).sort({ itemSerialNumber: 1 })
      .select("-__v");

    let itemSerialNumber = 0
    let validIndex = 0

    parsedItemBrandOrQuality.forEach(async (item, index) => {
      validIndex = index + 1
      const file = req.files[index];
      const base64Image = file.buffer.toString('base64');

      itemSerialNumber = itemsCount.length != 0 ?
        itemsCount[itemsCount.length - 1].itemSerialNumber : 0
      const updatedData = {
        brandOrQualityName: item.brandOrQualityName,
        description: item.description,
        adminNote: item.adminNote || " ",
        buyingPrice: item.buyingPrice,
        price: item.price,
        unit: item.unit,
        itemUnitCoefficient: item.unitCoefficient,
        // itemPhoto: req.files[index].location,
        itemPhoto: `data:${file.mimetype};base64,${base64Image}`,
        acceptDecimal: item.acceptDecimal,
        minimumQuantity: item.minimumQuantity,
      };
      const dataToBeAdded = {
        itemCategory: parsedItemCategory,
        itemName: parsedItemName,
        itemSerialNumber: itemSerialNumber + validIndex,
        isBrandOrQuality: parsedIsBrandOrQuality,
        itemBrandOrQuality: updatedData,
        itemWrapper: parsedItemWrapperId,
        createdAdminId: adminId,
        // minimumQuantity: minimumQuantity,
      };
      if (
        !category.itemsWrapper.find(
          (item) => String(item._id) === String(itemWrapperId)
        )
      ) {
        category.itemsWrapper.push(itemWrapperId);
      }
      const addedItem = await new Item(dataToBeAdded);
      foundItemWrapper.items.push(addedItem._id);
      const updatedItem = await addedItem.save();
    });

    const updatedCategory = await category.save();
    const updatedItemWrapper = await foundItemWrapper.save();
    res.status(200).json({
      message: "Item added successfully",
      // item: addedItem,
      // updated,
    });
    // }
    //   }
    // });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addNewItem = async (req, res, next) => {
  try {
    // const adminId = req.headers.adminid || "";
    // const getAdminBranchName = await adminModel.findById(adminId).select("branchName")
    // const folderName = `branch-${adminId}`
    // const uploadImageMiddleware = uploadImage(folderName);
    // uploadImageMiddleware(req, res, async (err) => {
    //   if (err) {
    //     console.log("inside error", err);
    //   } else {
    if (req.file == undefined) {
      res.status(404).json({
        success: false,
        message: "File is undefined!",
        // file: `uploads/${req.file.key}`,
      });
    } else {
      const base64Image = req.file.buffer.toString('base64');

      const imageData = {
        mimetype: req.file.mimetype,
        data: base64Image
      };
      const dataUrl = `data:${imageData.mimetype};base64,${imageData.data}`;

      console.log('dataUrl:', dataUrl);

      const {
        itemCategory,
        itemName,
        itemWrapperId,
        isBrandOrQuality,
        itemBrandOrQuality,
        buyingPrice,
        description,
        adminNote,
        price,
        unit,
        acceptDecimal,
        itemUnitCoefficient,
        archivedItem,
        minimumQuantity,
      } = req.body;
      const adminId = req.headers.adminid || "";
      console.log('adminNote:', adminNote);
      const parsedItemName = itemName;
      const parsedItemBrandOrQuality = JSON.parse(itemBrandOrQuality);
      const parsedItemCategory = itemCategory;
      const parsedIsBrandOrQuality = JSON.parse(isBrandOrQuality);
      const parsedItemBuyingPrice = JSON.parse(buyingPrice);
      const parsedItemDescription = JSON.parse(description);
      const parsedAdminNote = JSON.parse(adminNote);
      const parsedItemPrice = JSON.parse(price);
      const parsedItemUnit = unit;
      const parsedAcceptDecimal = JSON.parse(acceptDecimal);
      const parsedItemUnitCoEfficient = itemUnitCoefficient;
      const parsedMinimumQuantity = minimumQuantity;

      if (
        !parsedItemCategory ||
        !parsedItemName ||
        !itemWrapperId ||
        parsedIsBrandOrQuality === undefined ||
        !parsedItemBuyingPrice ||
        !parsedItemDescription ||
        !parsedItemPrice ||
        !parsedMinimumQuantity ||
        !parsedItemUnit ||
        !parsedItemUnitCoEfficient ||
        Object.keys(req.body).filter((key) => key == "acceptDecimal")
          .length === 0
      ) {
        throw new ValidationError("Please enter all mandatory fields");
      }

      let category = await Category.findById(itemCategory).select("-__v");
      console.log('category:', category);
      let itemsCount = await Item.find({ itemCategory: itemCategory }).select("-__v");

      let foundItemWrapper = await ItemWrapper.findById(
        itemWrapperId
      ).select("-__v");
      console.log('foundItemWrapper:', foundItemWrapper);

      const itemSerialNumber = itemsCount.length > 0 ?
        itemsCount.length + 1 : 1

      if (!category || !foundItemWrapper) {
        throw new BadRequest("category or itemwrapper is not found");
      }

      const url = req.protocol + "://" + req.get("host");

      const dataToBeAdded = {
        itemCategory: parsedItemCategory,
        itemName: parsedItemName,
        itemSerialNumber: itemSerialNumber,
        isBrandOrQuality: parsedIsBrandOrQuality,
        itemBrandOrQuality: parsedItemBrandOrQuality,
        // itemPhoto: url + "/images/uploads/" + req.file.filename,
        itemPhoto: dataUrl,
        buyingPrice: parsedItemBuyingPrice,
        description: parsedItemDescription,
        adminNote: parsedAdminNote || " ",
        price: parsedItemPrice,
        unit: parsedItemUnit,
        acceptDecimal: parsedAcceptDecimal,
        itemUnitCoefficient: parsedItemUnitCoEfficient,
        itemWrapper: itemWrapperId,
        archivedItem: archivedItem,
        createdAdminId: adminId,
        minimumQuantity: minimumQuantity,
      };

      const addedItem = await new Item(dataToBeAdded);
      if (
        !category.itemsWrapper.find(
          (item) => String(item._id) === String(itemWrapperId)
        )
      ) {
        category.itemsWrapper.push(itemWrapperId);
      }
      foundItemWrapper.items.push(addedItem._id);
      const updatedItem = await addedItem.save();
      const updatedCategory = await category.save();
      const updatedItemWrapper = await foundItemWrapper.save();

      res.status(200).json({
        message: "Item added successfully",
        item: updatedItem,
        updatedCategory,
        updatedItemWrapper,
      });
    }
    //   }
    // });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const editItemWithImage = async (req, res, next) => {
  try {
    uploadImage(req, res, async (err) => {
      if (err) {
        console.log("inside error", err);
        console.log(err);
      } else {
        if (req.file === undefined) {
          res.status(404).json({
            success: false,
            message: "File is undefined!",
            file: `uploads/${req.file.filename}`,
          });
        } else {
          const {
            categoryId,
            categoryName,
            serialNumber,
            itemId,
            itemName,
            itemWrapperId,
            brandOrQualityName,
            buyingPrice,
            description,
            adminNote,
            price,
            unit,
            acceptDecimal,
            itemUnitCoefficient,
          } = req.body;

          const parsedSerialNumber = JSON.parse(serialNumber);
          const parsedBuyingPrice = JSON.parse(buyingPrice);
          const parsedDescription = JSON.parse(description);
          const parsedAdminNote = JSON.parse(adminNote);
          const parsedPrice = JSON.parse(price);
          const parsedItemUnitCoEfficient = JSON.parse(itemUnitCoefficient);

          if (
            !categoryId ||
            !categoryName ||
            !parsedSerialNumber ||
            !itemName ||
            !itemId ||
            !itemWrapperId ||
            !parsedBuyingPrice ||
            !parsedDescription ||
            !parsedPrice ||
            !unit ||
            Object.keys(req.body).filter((key) => key == "acceptDecimal")
              .length === 0 ||
            !parsedItemUnitCoEfficient
          ) {
            throw new ValidationError("please enter all mandatory fields");
          }

          const foundCategory = await Category.findById(categoryId).select(
            "-__v"
          );

          const foundItemWrapper = await ItemWrapper.findById(
            itemWrapperId
          ).select("-__v");

          let foundItem = await Item.findById(itemId);

          if (!foundCategory || !foundItemWrapper || !foundItem) {
            throw new BadRequest("item not found");
          }

          // For changing the category serial number
          if (foundCategory.categoryName !== categoryName) {
            foundCategory.categoryName = categoryName;
            await foundCategory.save();
          }

          if (foundCategory.serialNumber !== serialNumber) {
            if (foundCategory.serialNumber < serialNumber) {
              const allCategories = await Category.find({})
                .sort({ serialNumber: 1 })
                .select("-__v");

              const dataNeedsToBeUpdated = allCategories.filter(
                (category) =>
                  category.serialNumber <= serialNumber &&
                  category.serialNumber !== foundCategory.serialNumber
              );

              const bulkUpdateData = dataNeedsToBeUpdated.map((category) => ({
                updateOne: {
                  filter: {
                    _id: category._id,
                  },
                  update: {
                    serialNumber: category.serialNumber - 1,
                  },
                },
              }));

              foundCategory.serialNumber = serialNumber;

              await Category.bulkWrite(bulkUpdateData);
              await foundCategory.save();
            }

            if (foundCategory.serialNumber > serialNumber) {
              const allCategories = await Category.find({})
                .sort({ serialNumber: 1 })
                .select("-__v");

              const dataNeedsToBeUpdated = allCategories.filter(
                (category) =>
                  category.serialNumber >= serialNumber &&
                  category.serialNumber !== foundCategory.serialNumber
              );

              const bulkUpdateData = dataNeedsToBeUpdated.map((category) => ({
                updateOne: {
                  filter: {
                    _id: category._id,
                  },
                  update: {
                    serialNumber: category.serialNumber + 1,
                  },
                },
              }));

              foundCategory.serialNumber = serialNumber;

              await Category.bulkWrite(bulkUpdateData);
              await foundCategory.save();
            }
          }

          const url = req.protocol + "://" + req.get("host");
          if (Object.keys(foundItem.itemBrandOrQuality.toObject()).length > 0) {

            const sameItems = await Item.find({
              createdAdminId: foundItem.createdAdminId,
              itemName: foundItem.itemName
            });

            if (sameItems.length > 1) {
              sameItems.forEach(async (item) => {
                item.itemName = itemName
                await item.save()
              })
            }
            foundItemWrapper.itemName = itemName
            await foundItemWrapper.save();

            foundItem.itemName = itemName;
            foundItem.itemBrandOrQuality = {
              ...foundItem.itemBrandOrQuality,
              brandOrQualityName: brandOrQualityName,
              itemPhoto: req.file.originalname ? req.file.location : itemPhoto,
              buyingPrice: parsedBuyingPrice,
              description: parsedDescription,
              adminNote: parsedAdminNote,
              price: parsedPrice,
              itemUnitCoefficient: parsedItemUnitCoEfficient,
              unit: unit,
              acceptDecimal: acceptDecimal,
            };
            const updatedItem = await foundItem.save();
            return res
              .status(200)
              .json({ message: "item edited successfully", updatedItem });
          } else {

            const sameItems = await Item.find({
              createdAdminId: foundItem.createdAdminId,
              itemName: foundItem.itemName
            });

            if (sameItems.length > 1) {
              sameItems.forEach(async (item) => {
                item.itemName = itemName
                await item.save()
              })
            }
            foundItemWrapper.itemName = itemName
            await foundItemWrapper.save();

            foundItem.itemName = itemName;
            foundItem.itemPhoto = req.file.originalname
              ? req.file.location
              : itemPhoto;
            foundItem.buyingPrice = parsedBuyingPrice;
            foundItem.description = parsedDescription ?? parsedDescription;
            foundItem.adminNote = parsedAdminNote ?? parsedAdminNote;
            foundItem.price = parsedPrice;
            foundItem.itemUnitCoefficient = parsedItemUnitCoEfficient;
            foundItem.unit = unit;
            foundItem.acceptDecimal = acceptDecimal;

            const updatedItem = await foundItem.save();
            return res
              .status(200)
              .json({ message: "item edited successfully", updatedItem });
          }
        }
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const editItem = async (req, res, next) => {
  try {
    const {
      categoryId,
      categoryName,
      serialNumber,
      itemSerialNumber,
      itemId,
      itemName,
      itemWrapperId,
      brandOrQualityName,
      buyingPrice,
      description,
      adminNote,
      price,
      unit,
      itemUnitCoefficient,
      archivedItem,
      itemPhoto,
      acceptDecimal,
      minimumQuantity,
    } = req.body;

    const adminId = req.headers.adminid || "";

    if (
      !categoryId ||
      !categoryName ||
      !serialNumber ||
      !itemName ||
      !itemId ||
      !itemWrapperId ||
      !buyingPrice ||
      !description ||
      !price ||
      !unit ||
      !minimumQuantity ||
      !itemUnitCoefficient ||
      Object.keys(req.body).filter((key) => key == "acceptDecimal").length === 0
    ) {
      throw new ValidationError("please enter all mandatory fields");
    }

    const foundCategory = await Category.findById(categoryId).select("-__v");

    const foundItemWrapper = await ItemWrapper.findById(itemWrapperId).select(
      "-__v"
    );

    console.log('foundItemWrapper:', foundItemWrapper)


    const foundItem = await Item.findById(itemId);


    if (!foundCategory || !foundItemWrapper || !foundItem) {
      throw new BadRequest("item not found");
    }

    if (foundCategory.categoryName !== categoryName) {
      foundCategory.categoryName = categoryName;
      await foundCategory.save();
    }

    if (foundItemWrapper.itemName !== itemName) {
      foundItemWrapper.itemName = itemName
      await foundItemWrapper.save();
    }

    if (foundCategory.serialNumber !== serialNumber) {
      if (foundCategory.serialNumber < serialNumber) {
        const allCategories = await Category.find({})
          .sort({ serialNumber: 1 })
          .select("-__v");


        const dataNeedsToBeUpdated = allCategories.filter(
          (category) =>
            category.serialNumber > foundCategory.serialNumber &&
            category.serialNumber <= serialNumber
        );
        const bulkUpdateData = dataNeedsToBeUpdated.map((category) => ({
          updateOne: {
            filter: {
              _id: category._id,
            },
            update: {
              serialNumber: category.serialNumber - 1,
            },
          },
        }));

        foundCategory.serialNumber = serialNumber;

        await Category.bulkWrite(bulkUpdateData);
        await foundCategory.save();
      }

      if (foundCategory.serialNumber > serialNumber) {
        const allCategories = await Category.find({})
          .sort({ serialNumber: 1 })
          .select("-__v");

        const dataNeedsToBeUpdated = allCategories.filter(
          (category) =>
            category.serialNumber < foundCategory.serialNumber &&
            category.serialNumber >= serialNumber
        );
        const bulkUpdateData = dataNeedsToBeUpdated.map((category) => ({
          updateOne: {
            filter: {
              _id: category._id,
            },
            update: {
              serialNumber: category.serialNumber + 1,
            },
          },
        }));

        foundCategory.serialNumber = serialNumber;

        await Category.bulkWrite(bulkUpdateData);
        await foundCategory.save();
      }
    }

    if (foundItem.itemSerialNumber !== itemSerialNumber) {
      if (foundItem.itemSerialNumber < itemSerialNumber) {
        const allItems = await Item.find({ itemCategory: categoryId })
          .sort({ itemSerialNumber: 1 })
          .select("-__v");

        console.log('allItems:', allItems);
        const dataNeedsToBeUpdated = allItems.filter(
          (item) =>
            item.itemSerialNumber > foundItem.itemSerialNumber &&
            item.itemSerialNumber <= itemSerialNumber
        );
        const bulkUpdateData = dataNeedsToBeUpdated.map((item) => ({
          updateOne: {
            filter: {
              _id: item._id,
            },
            update: {
              itemSerialNumber: item.itemSerialNumber - 1,
            },
          },
        }));

        foundItem.itemSerialNumber = itemSerialNumber;

        await Item.bulkWrite(bulkUpdateData);
        await foundItem.save();
      }

      if (foundItem.itemSerialNumber > itemSerialNumber) {
        const allItems = await Item.find({ itemCategory: categoryId })
          .sort({ itemSerialNumber: 1 })
          .select("-__v");

        const dataNeedsToBeUpdated = allItems.filter(
          (item) =>
            item.itemSerialNumber < foundItem.itemSerialNumber &&
            item.itemSerialNumber >= itemSerialNumber
        );
        const bulkUpdateData = dataNeedsToBeUpdated.map((item) => ({
          updateOne: {
            filter: {
              _id: item._id,
            },
            update: {
              itemSerialNumber: item.itemSerialNumber + 1,
            },
          },
        }));

        foundItem.itemSerialNumber = itemSerialNumber;

        await Item.bulkWrite(bulkUpdateData);
        await foundItem.save();
      }
    }

    if (Object.keys(foundItem.itemBrandOrQuality.toObject()).length > 0) {

      const sameItems = await Item.find({
        createdAdminId: adminId,
        itemName: foundItem.itemName
      });

      if (sameItems.length > 1) {
        sameItems.forEach(async (item) => {
          item.itemName = itemName
          await item.save()
        })
      }

      foundItem.itemName = itemName;
      foundItemWrapper.itemName = itemName
      await foundItemWrapper.save();
      foundItem.itemBrandOrQuality = {
        ...foundItem.itemBrandOrQuality,
        brandOrQualityName: brandOrQualityName,
        itemPhoto: itemPhoto,
        buyingPrice: buyingPrice,
        description: description,
        adminNote: adminNote,
        price: price,
        itemUnitCoefficient: itemUnitCoefficient,
        unit: unit,
        acceptDecimal: acceptDecimal,
        archivedItem: archivedItem,
        minimumQuantity: minimumQuantity,
      };

      const updatedItem = await foundItem.save();

      return res
        .status(200)
        .json({ message: "item edited successfully", updatedItem });
    } else {

      const sameItems = await Item.find({
        createdAdminId: adminId,
        itemName: foundItem.itemName
      });

      if (sameItems.length > 1) {
        sameItems.forEach(async (item) => {
          item.itemName = itemName
          await item.save()
        })
      }

      foundItem.itemName = itemName;
      foundItemWrapper.itemName = itemName
      await foundItemWrapper.save();
      foundItem.itemPhoto = itemPhoto;
      foundItem.buyingPrice = buyingPrice;
      foundItem.description = description ?? description;
      foundItem.adminNote = adminNote ?? adminNote;
      foundItem.price = price;
      foundItem.itemUnitCoefficient = itemUnitCoefficient;
      foundItem.unit = unit;
      foundItem.acceptDecimal = acceptDecimal;
      foundItem.minimumQuantity = minimumQuantity;

      const updatedItem = await foundItem.save();
      return res
        .status(200)
        .json({ message: "item edited successfully", updatedItem });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const items = await Item.findById(itemId).select("-__v");
    return res.status(200).json({ message: "fetched all items", items });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { categoryId, itemId, itemWrapperId, createdAdminId } = req.params;

    const getAdminBranchName = await adminModel.findById(createdAdminId).select("branchName")
    const foundItem = await Item.findById(itemId);
    const foundCategories = await Category.find({ createdAdminId: createdAdminId });
    const foundItemWrapper = await ItemWrapper.findById(itemWrapperId);

    if (!foundItem || !foundItemWrapper) {
      throw BadRequest("Item not found");
    }

    foundItemWrapper.items = foundItemWrapper.items.filter(
      (id) => String(id) !== String(itemId)
    );

    const categorySerialNumber = await Category.findById(foundItem.itemCategory);

    console.log('foundItemWrapper:', foundItemWrapper);

    // const splitImageKey = foundItem.isBrandOrQuality
    //   ? foundItem.itemBrandOrQuality.itemPhoto?.split('/')
    //   : foundItem.itemPhoto?.split('/')

    // const getImageKey = splitImageKey[splitImageKey?.length - 1]
    // const deleteImagePath = `branch-${createdAdminId}/item-images/`

    // const params = {
    //   Bucket: process.env.BACKBLAZE_BUCKET_NAME,
    //   Key: deleteImagePath + getImageKey,
    // };
    // const response = await s3.deleteObject(params).promise();

    // console.log('response:', response);
    // if (!response.DeleteMarker) {
    //   return res.status(500).json({ message: "item is not deleted in backblaze" })
    // }

    await Item.findByIdAndDelete(itemId);

    await foundItemWrapper.save();

    const getItemsForSerialUpdate = await Item.find({ itemCategory: categoryId });

    await Promise.all(getItemsForSerialUpdate.map(async (item) => {
      if (item.itemSerialNumber > foundItem.itemSerialNumber) {
        item.itemSerialNumber = item.itemSerialNumber - 1;
        await item.save();
      }
    }))

    if (getItemsForSerialUpdate.length == 0) {
      await Promise.all(foundCategories.map(async (data) => {
        if (data.serialNumber > categorySerialNumber.serialNumber) {
          data.serialNumber = data.serialNumber - 1;
          await data.save();
        }
      }));
    }

    const categoriItems = await Item.find({ itemCategory: foundItem.itemCategory }).count();

    if (categoriItems == 0) {
      await Category.findByIdAndDelete(foundItem.itemCategory)
    }

    const foundCategories1 = await Category.find({ createdAdminId: createdAdminId });
    const getSerialNumCounter = await Counter.findOne({ createdAdminId: createdAdminId })
    getSerialNumCounter.serialNumber = foundCategories1.length
    await getSerialNumCounter.save()

    return res.status(200).json({ message: "Item Deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getItemNames = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const itemNames = await Item.find({ createdAdminId: adminId }).select(
      "_id itemName"
    );
    return res.status(200).json({ message: "fetched item names", itemNames });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  addNewItem,
  uploadImage,
  editItem,
  getAllItems,
  getItemNames,
  addMultipleItems,
  editItemWithImage,
  deleteItem,
};
