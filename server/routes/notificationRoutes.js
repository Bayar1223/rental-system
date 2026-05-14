const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/mark-all-read", protect, markAllRead);
router.put("/:id/read", protect, markOneRead);

module.exports = router;