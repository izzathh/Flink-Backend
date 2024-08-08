const Category = require("../models/category.model");
const Item = require("../models/item.model");
const Counter = require("../models/counter.model");
const ItemWrapper = require("../models/itemWrapper.model");
const Common = require("../models/common.model");
const Cities = require("../models/cities.model");
const adminModel = require("../models/admin.model");
const Group = require("../models/group.model");

const getCategoryMappings = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    // const categories = await Category.find({ createdAdminId: adminId }).select(
    //   "-__v -createdAt -updatedAt -items"
    // );
    const items = await Category.find({ createdAdminId: adminId })
      .sort({ serialNumber: 1 })
      .populate({
        path: "itemsWrapper",
        populate: [
          {
            path: "items",
            model: "Item",
            select: {
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      })
      .exec();

    const filteredData = items.filter(data => data.itemsWrapper.length === 0)

    const itemWrapperToDelete = await ItemWrapper.find({ items: [] });
    if (itemWrapperToDelete.length > 0) {
      await ItemWrapper.deleteMany({
        _id: { $in: itemWrapperToDelete.map(doc => doc._id) }
      });
    }

    if (filteredData.length >= 1) {
      for (const item of filteredData) {
        await Category.findByIdAndDelete(item._id)
      }
    }

    const filteredDataItem = items.filter(data => data.itemsWrapper.filter(item => item.items.length === 0))
    console.log('filteredDataItem:', filteredDataItem)

    for (const item of filteredDataItem) {
      const filteredItem = item.itemsWrapper.filter(item => item.items.length === 0)
      for (const data of filteredItem) {
        await ItemWrapper.findByIdAndDelete(data._id)
        await Category.updateMany(
          { _id: item._id },
          {
            $pull: {
              itemsWrapper: {
                $in: data._id
              }
            }
          }
        )
      }
    }


    return res
      .status(200)
      .json({ message: "fetched all category mappings", categories: items });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// const getItemsMappings = async (req, res, next) => {
//   try {
//     const { categoryId } = req.params;
//     const category = await Category.findById(categoryId)
//       .populate("itemsWrapper")
//       .exec();
//     // const items = await Item.find({}).select("itemName _id itemBrandOrQuality");

//     const items = category.itemsWrapper.map((item) => ({
//       itemName: item.itemName,
//       itemWrapperId: item._id,
//     }));

//     // const itemNamesFromItems = items.map((item) => item?.itemName);

//     // let set = new Set(itemNamesFromItems);
//     // const uniqueItems = [...set];
//     // const dataToSend = uniqueItems.map((item) => ({ itemName: item }));
//     return res.status(200).json({
//       message: "fetched all items mappings",
//       items: items,
//     });
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// };

const getItemsMappings = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const adminId = req.headers.adminid || "";
    // const items = await Item.find({
    //   createdAdminId: adminId,
    //   itemCategory: categoryId,
    // }).select("_id itemName itemCategory itemWrapper");

    const items = await Category.find({
      createdAdminId: adminId,
      _id: categoryId,
    })
      .populate({
        path: "itemsWrapper",
      })
      .exec();

    const dataToSend = items.map((item) =>
      item.itemsWrapper.map((itemWrapper) => ({
        itemCategory: item._id,
        itemWrapperId: itemWrapper._id,
        itemName: itemWrapper.itemName,
      }))
    );

    return res.status(200).json({
      message: "fetched all items mappings",
      items: dataToSend.flat(),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getPriceMappings = async (req, res, next) => {
  try {
    const { itemName } = req.params;
    const adminId = req.headers.adminid || "";

    const items = await Item.find({
      createdAdminId: adminId,
      itemName: itemName,
    }).select("_id isBrandOrQuality itemBrandOrQuality.price price")
      .sort({ price: 1, 'itemBrandOrQuality.price': 1 })
      .lean()

    const getAllPrice = items.map((item) => {
      console.log('items:', item);
      let itemId
      let prices
      if (item.isBrandOrQuality) {
        itemId = item._id
        prices = item.itemBrandOrQuality.price
      } else {
        itemId = item._id
        prices = item.price
      }
      return {
        _id: itemId,
        itemPrice: prices
      }
    })

    // const dataToSend = items.filter(
    //   (item) => Object.keys(item.itemBrandOrQuality.toObject()).length > 0
    // );

    // const finalData = dataToSend.map((data) => ({
    //   _id: data._id,
    //   brandOrQualityName: data.itemBrandOrQuality.brandOrQualityName,
    // }));

    return res.status(200).json({
      message: "fetched all items mappings",
      items: getAllPrice,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


const getListedItems = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const items = await Category.find({ createdAdminId: adminId })
      .sort({ serialNumber: 1 })
      .populate({
        path: "itemsWrapper",
        populate: [
          {
            path: "items",
            model: "Item",
            select: {
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      })
      .exec();

    const serialNumber = await Counter.find({ createdAdminId: adminId })
      .sort({ updatedAt: -1 })
      .select("-_id serialNumber");
    const commonCurrency = await Common.findOne({
      createdAdminId: adminId,
    }).select("currency");

    const dataToSend = [];
    items.map(async (upperItem, index) => {
      const itemFromItemWrapper = upperItem.itemsWrapper.map(
        (itemWrapper, itemsWrapperIndex) => {
          const innerItems = itemWrapper.items.map((item, innerItemIndex) => {
            const innerItemDataToBeAdded = {
              itemWrapperId: itemWrapper._id,
              itemCategory: item.itemCategory,
              itemId: item._id,
              itemName: item.itemName,
              createdAt: item.createdAt,
              isBrandOrQuality: item.isBrandOrQuality,
              itemSerialNumber: item.itemSerialNumber,
              itemPhoto:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.itemPhoto
                  : item.itemPhoto,
              itemUnitCoefficient:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.itemUnitCoefficient
                  : item.itemUnitCoefficient,
              buyingPrice:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.buyingPrice
                  : item.buyingPrice,
              description:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.description
                  : item.description,
              adminNote:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.adminNote
                  : item.adminNote,
              price:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.price
                  : item.price,
              unit:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.unit
                  : item.unit,
              acceptDecimal:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.acceptDecimal
                  : item.acceptDecimal || false,
              minimumQuantity:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.minimumQuantity
                  : item.minimumQuantity,
              brandOrQualityName:
                Object.keys(item.itemBrandOrQuality.toObject()).length > 0
                  ? item.itemBrandOrQuality.brandOrQualityName
                  : "",
            };
            return innerItemDataToBeAdded;
          });
          return innerItems;
          // return [...innerItems];
        }
      );
      return dataToSend.push({
        categoryName: upperItem.categoryName,
        _id: upperItem._id,
        serialNumber: upperItem.serialNumber,
        items: [...itemFromItemWrapper.flat()],
      });
    });

    dataToSend.forEach((category) => {
      const newArray = category.items.map((item) => {
        return {
          ...item,
          lastItemSerialNumber: category.items.length
        };
      });
      category.items = newArray
      category.items.sort((a, b) => a.itemSerialNumber - b.itemSerialNumber);
    });

    return res.status(200).json({
      message: "fetched all items",
      items: dataToSend,
      lastSerialNumber: serialNumber[0].serialNumber,
      currency: commonCurrency.currency,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Need to rewrite the logic for this
const getFilteredListedItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const items = await Item.find({ _id: itemId }).populate("itemCategory");
    const itemsByWrapper = await Item.find({ itemWrapper: itemId }).populate(
      "itemCategory"
    );
    const itemsByCategory = await Item.find({ itemCategory: itemId }).populate(
      "itemCategory"
    );

    const variableToLoop =
      items.length > 0
        ? items
        : itemsByWrapper.length > 0
          ? itemsByWrapper
          : itemsByCategory;

    const modifiedData = variableToLoop.map((item, innerItemIndex) => {
      const innerItemDataToBeAdded = {
        categoryName: item.itemCategory.categoryName,
        _id: item.itemCategory._id,
        serialNumber: item.itemCategory.serialNumber,
        itemWrapperId: item.itemWrapper,
        itemId: item._id,
        itemName: item.itemName,
        createdAt: item.createdAt,
        isBrandOrQuality: item.isBrandOrQuality,
        itemPhoto:
          Object.keys(item.itemBrandOrQuality.toObject()).length > 0
            ? item.itemBrandOrQuality.itemPhoto
            : item.itemPhoto,
        itemUnitCoefficient:
          Object.keys(item.itemBrandOrQuality.toObject()).length > 0
            ? item.itemBrandOrQuality.itemUnitCoefficient
            : item.itemUnitCoefficient,
        price:
          Object.keys(item.itemBrandOrQuality.toObject()).length > 0
            ? item.itemBrandOrQuality.price
            : item.price,
        description:
          Object.keys(item.itemBrandOrQuality.toObject()).length > 0
            ? item.itemBrandOrQuality.description
            : item.description,
        unit:
          Object.keys(item.itemBrandOrQuality.toObject()).length > 0
            ? item.itemBrandOrQuality.unit
            : item.unit,
        brandOrQualityName:
          Object.keys(item.itemBrandOrQuality.toObject()).length > 0
            ? item.itemBrandOrQuality.brandOrQualityName
            : "",
      };
      return innerItemDataToBeAdded;
    });

    return res.status(200).json({
      message: "Fetched Items successfully!",
      items: modifiedData,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllBranchCode = async (req, res, next) => {
  try {
    const getBranchCode = await adminModel.find({
      adminType: "super",
      branchCode: { $exists: true }
    }).select("branchCode")
    return res.json({ allBranchCode: getBranchCode })
  } catch (e) {
    console.log('getAllBranchCode:', e);
    next(e)
  }
}

const getCityNames = async (req, res, next) => {
  try {
    const { country, state, searchParam, flag } = req.query;
    console.log('country-state-city:', country, state, searchParam);
    const getAllCityNames = await Cities.findOne({
      name: country
    });

    const regex1 = new RegExp('^' + state, 'i');

    const getStateData = getAllCityNames.states.filter(stateName => stateName.name == state || regex1.test(stateName.name))
    console.log('getStateData:', getStateData);
    let getCityData
    const regex = new RegExp('^' + searchParam, 'i');
    if (flag) {
      getCityData = getStateData[0].cities.filter(city => searchParam.includes(city.name) || regex.test(city.name));
    } else {
      getCityData = getStateData[0].cities.filter(city => regex.test(city.name));
    }
    console.log('getCityData:', getCityData);
    return res.status(201).json({ cities: getCityData })
  } catch (error) {
    console.log(error);
    next(error)
  }
}

const getAllCoordinates = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const getEveryCoordinates = await Group.find({
      createdAdminId: adminId,
      hasGroup: false
    }).select('geometry areaName createdAdminId')
    console.log('getEveryCoordinates:', getEveryCoordinates);
    return res.status(201).json({ coordinates: getEveryCoordinates })
  } catch (error) {
    console.log(error);
    next(error)
  }
}

module.exports = {
  getListedItems,
  getAllBranchCode,
  getPriceMappings,
  getItemsMappings,
  getCategoryMappings,
  getFilteredListedItem,
  getCityNames,
  getAllCoordinates
};
