const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  toggleFavorite,
  removeFavorite,
  getFavoriteIds,
  getFavorites,
} = require("../controllers/favoriteController");

// ⚠️ Тогтмол path (/ids) нь /:propertyId-аас ӨМНӨ
router.get("/ids", protect, getFavoriteIds);
router.get("/",    protect, getFavorites);

router.post("/:propertyId",   protect, toggleFavorite);
router.delete("/:propertyId", protect, removeFavorite);

module.exports = router;