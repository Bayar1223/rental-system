const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/users/profile — профайл авах
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Профайл авахад алдаа гарлаа" });
  }
};

// PUT /api/users/profile — профайл засах
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const userId = req.user._id || req.user.id;

    // Имэйл давхардаж байгаа эсэх шалгах
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: "Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна" });
      }
    }

    // Утасны дугаар давхардаж байгаа эсэх шалгах
    if (phone) {
      const existing = await User.findOne({ phone, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: "Энэ утасны дугаар аль хэдийн бүртгэлтэй байна" });
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone, email },
      { new: true }
    ).select("-password");

    res.json({ message: "Профайл амжилттай шинэчлэгдлээ", user: updated });
  } catch (error) {
    res.status(500).json({ message: "Профайл шинэчлэхэд алдаа гарлаа" });
  }
};

// PUT /api/users/change-password — нууц үг солих
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Бүх талбарыг бөглөнө үү" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" });
    }

    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Одоогийн нууц үг буруу байна" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Нууц үг амжилттай солигдлоо" });
  } catch (error) {
    res.status(500).json({ message: "Нууц үг солиход алдаа гарлаа" });
  }
};