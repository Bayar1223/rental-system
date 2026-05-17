const Notification = require("../models/Notification");

// Мэдэгдэл үүсгэх (дотоод хэрэглээнд)
exports.createNotification = async ({ user, title, message, type, link }) => {
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (error) {
    console.error("Notification create error:", error);
  }
};

// GET /api/notifications — Миний мэдэгдлүүд
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id || req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Мэдэгдэл авахад алдаа гарлаа" });
  }
};

// GET /api/notifications/unread-count — Уншигдаагүй тоо
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id || req.user.id,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

// PUT /api/notifications/mark-all-read — Бүгдийг уншсан болгох
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id || req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Бүгд уншигдсан болгогдлоо" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

// PUT /api/notifications/:id/read — Нэгийг уншсан болгох
exports.markOneRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Уншигдсан болгогдлоо" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

// ← НЭМСЭН: DELETE /api/notifications/:id — Нэг мэдэгдэл устгах
exports.deleteOne = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: "Мэдэгдэл олдсонгүй" });
    if (notif.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Устгагдлаа" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};

// ← НЭМСЭН: DELETE /api/notifications/all — Бүгдийг устгах
exports.deleteAll = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Notification.deleteMany({ user: userId });
    res.json({ message: "Бүх мэдэгдэл устгагдлаа" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};