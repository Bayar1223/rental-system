const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getLandlordAnalytics,
  getAdminAnalytics,
} = require("../controllers/analyticsController");

// Эзэн өөрийн байрнуудын аналитик
router.get("/landlord", protect, getLandlordAnalytics);

// Админд зориулсан бүх системийн аналитик
router.get("/admin", protect, getAdminAnalytics);

module.exports = router;