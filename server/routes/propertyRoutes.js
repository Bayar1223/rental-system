const upload = require("../middleware/upload");
const express = require("express");
const router = express.Router();

const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

const { protect } = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  upload.array("images", 20),
  createProperty
);
router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.put("/:id", protect, updateProperty);
router.delete("/:id", protect, deleteProperty);

module.exports = router;