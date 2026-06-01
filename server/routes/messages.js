const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
  getUnreadCount,
  getThreads,
} = require("../controllers/messageController");

// ⚠️ Тогтмол path-ууд (/unread-count, /threads) нь /:applicationId-аас ӨМНӨ байх ёстой,
//    эс бөгөөс param route нь тэдгээрийг барьж авна.
router.get("/unread-count", protect, getUnreadCount);
router.get("/threads",      protect, getThreads);

router.post("/",                 protect, sendMessage);
router.get("/:applicationId",    protect, getMessages);

module.exports = router;