const Notification = require("../models/Notification");

// Мэдэгдэл үүсгэх (дотоод хэрэглээнд)
exports.createNotification = async ({ user, title, message, type, link }) => {
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (error) {
    console.error("Notification create error:", error);
  }
};

// Миний мэдэгдлүүд авах
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id || req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Мэдэгдэл авахад алдаа гарлаа" });
  }
};

// Уншигдаагүй мэдэгдлийн тоо
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

// Бүгдийг уншсан болгох
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

// Нэгийг уншсан болгох
exports.markOneRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Уншигдсан болгогдлоо" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа" });
  }
};