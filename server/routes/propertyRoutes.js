const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  getPropertyById,
  getMyProperties,   // ⭐ ШИНЭ
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

router.get("/", getProperties);

// ⭐ ШИНЭ — /:id-ийн ӨМНӨ байх ёстой!
// Хэрвээ /:id-ийн дараа бол Express "landlord"-ыг ObjectId гэж буруу үзнэ
router.get("/landlord", protect, getMyProperties);

router.get("/:id", getPropertyById);
router.post("/", protect, upload.array("images", 20), createProperty);
router.put("/:id", protect, upload.fields([{ name: "images", maxCount: 20 }]), updateProperty);
router.delete("/:id", protect, deleteProperty);

module.exports = router;