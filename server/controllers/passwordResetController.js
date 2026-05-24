// ═══════════════════════════════════════════════════════════════════
//  📁 server/controllers/passwordResetController.js
//  ⭐ PHASE 2: OTP-based password reset (client-ийн UI-тай таарна)
// ═══════════════════════════════════════════════════════════════════

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  createOtp,
  sendEmailOtp,
  verifyOtp,
} = require("../services/otpService");

// POST /api/password-reset/request
// Имэйл хаягт сэргээх 6-оронтой код илгээх
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Имэйл хаяг оруулна уу" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // ⚠️ Аюулгүй байдлын үүднээс — хэрэглэгч байгаа эсэхийг илчлэхгүй
    // Хэрвээ оршдоггүй имэйл бол ч success буцаана (enumeration халдлагаас сэргийлэх)
    if (!user) {
      return res.json({
        message: "Хэрэв имэйл бүртгэлтэй бол сэргээх код илгээгдсэн.",
        email,
      });
    }

    // OTP үүсгэж имэйл рүү илгээх (одоогийн otpService infrastructure)
    const otp = await createOtp({
      identifier: email,
      type: "email",
      purpose: "forgot_password",
    });

    await sendEmailOtp({
      email,
      code: otp.code,
      purpose: "forgot_password",
      firstName: user.firstName,
    });

    res.json({
      message: "Сэргээх код таны имэйл рүү илгээгдлээ.",
      email,
    });
  } catch (error) {
    console.error("requestReset error:", error);
    res.status(500).json({
      message: "Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.",
    });
  }
};

// POST /api/password-reset/reset
// OTP кодыг шалгаад нууц үгийг шинэчлэх
exports.resetWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Бүх талбарыг бөглөнө үү" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой",
      });
    }

    // OTP шалгах
    const result = await verifyOtp({
      identifier: email.toLowerCase().trim(),
      code: otp,
      purpose: "forgot_password",
    });

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      message: "Нууц үг амжилттай шинэчлэгдлээ. Нэвтэрч орно уу.",
    });
  } catch (error) {
    console.error("resetWithOtp error:", error);
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};