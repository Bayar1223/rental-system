// ═══════════════════════════════════════════════════════════════════
//  📁 server/controllers/passwordResetController.js
//  ✅ ЗАСВАРЛАСАН — newPassword.length < 6 → < 8
//     (User model дээр minlength: 8 байгаатай нэгтгэв)
// ═══════════════════════════════════════════════════════════════════

const crypto    = require("crypto");
const bcrypt    = require("bcryptjs");
const User      = require("../models/User");
const { sendPasswordResetEmail } = require("../services/emailService");

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Имэйл хаяг оруулна уу" });

    const user = await User.findOne({ email });
    // Аюулгүй байдлын үүднээс хэрэглэгч олдсон эсэхийг илчлэхгүй
    if (!user) {
      return res.json({ message: "Хэрэв имэйл бүртгэлтэй бол сэргээх холбоос илгээгдлээ" });
    }

    // Reset token үүсгэх
    const resetToken  = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 цаг
    await user.save();

    await sendPasswordResetEmail({
      to:         process.env.RESEND_TEST_EMAIL || user.email,
      resetToken,
      firstName:  user.firstName,
    });

    res.json({ message: "Нууц үг сэргээх холбоос таны имэйл рүү илгээгдлээ" });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу." });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token болон шинэ нууц үг шаардлагатай" });
    }

    // ✅ ЗАСВАР: 6 → 8 (User model-ийн minlength-тай таарч байна)
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token хүчингүй эсвэл хугацаа дууссан байна" });
    }

    user.password             = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Нууц үг амжилттай шинэчлэгдлээ. Нэвтэрч орно уу." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};