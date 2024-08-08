const express = require("express");
const router = express.Router();
const checkAdmin = require("../middlewares/checkAdmin");
const checkAuth = require("../middlewares/checkAuth");
const {
  getListedItems,
  getItemsMappings,
  getPriceMappings,
  getAllBranchCode,
  getCategoryMappings,
  getFilteredListedItem,
  getCityNames,
  getAllCoordinates
} = require("../controllers/mapping.controller");
const { checkIsSuperAdmin } = require("../middlewares/checkRole");

router
  .route("/admin/categories")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getCategoryMappings);
router
  .route("/admin/items/:categoryId")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getItemsMappings);
router
  .route("/admin/listed-items")
  .all(checkAdmin)
  .all(checkIsSuperAdmin)
  .get(getListedItems);

router.route("/user/items/:categoryId").all(checkAuth).get(getItemsMappings);
router.route("/user/categories").all(checkAuth).get(getCategoryMappings);
router
  .route("/user/item-prices/:itemName")
  .all(checkAuth)
  .get(getPriceMappings);

router
  .route("/user/filtered-listed-items/:itemId")
  .all(checkAuth)
  .get(getFilteredListedItem);

router.route("/user/get-all-branch-code")
  .get(getAllBranchCode)

router
  .route("/admin/get-city-names")
  .all(checkAuth)
  .get(getCityNames);

router
  .route("/admin/get-coordinates")
  .all(checkAuth)
  .get(getAllCoordinates);

module.exports = router;
