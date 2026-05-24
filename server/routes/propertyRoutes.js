const express = require("express");
const router  = express.Router();
const upload  = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  getPropertyById,
  getMyProperties,
  getSimilarProperties,   // ⭐ ШИНЭ
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

// ⚠️ Route-ийн дараалал маш чухал
// Express дарааллаар нь шалгадаг — литерал замууд эхэнд

router.get("/",          getProperties);
router.get("/landlord",  protect, getMyProperties);

// ⭐ /:id/similar нь /:id-ийн ӨМНӨ байх ёстой
router.get("/:id/similar", getSimilarProperties);

router.get("/:id", getPropertyById);

router.post("/", protect, upload.array("images", 20), createProperty);

router.put(
  "/:id",
  protect,
  upload.fields([{ name: "images", maxCount: 20 }]),
  updateProperty
);

router.delete("/:id", protect, deleteProperty);

module.exports = router;