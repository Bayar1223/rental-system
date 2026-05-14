

const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");

const {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");

router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/", protect, upload.array("images", 20), createProperty);
router.put("/:id", protect, updateProperty);
router.delete("/:id", protect, deleteProperty);

module.exports = router;