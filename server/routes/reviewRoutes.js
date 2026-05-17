const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPropertyReviews,
  createReview,
  deleteReview,
} = require("../controllers/reviewController");

router.get("/property/:propertyId",  getPropertyReviews);
router.post("/property/:propertyId", protect, createReview);
router.delete("/:id",                protect, deleteReview);

module.exports = router;