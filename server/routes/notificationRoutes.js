const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
  deleteOne,   // ← НЭМСЭН
  deleteAll,   // ← НЭМСЭН
} = require("../controllers/notificationController");

router.get("/",                protect, getMyNotifications);
router.get("/unread-count",    protect, getUnreadCount);
router.put("/mark-all-read",   protect, markAllRead);
router.put("/:id/read",        protect, markOneRead);
router.delete("/all",          protect, deleteAll);   // ← НЭМСЭН (/:id-ийн өмнө байх ёстой)
router.delete("/:id",          protect, deleteOne);   // ← НЭМСЭН

module.exports = router;