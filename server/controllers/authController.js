const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createOtp,
  sendEmailOtp,
  sendSmsOtp,
  verifySmsOtp,
  verifyOtp,
} = require("../services/otpService");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ============================================================
// АЛХАМ 1: Бүртгэлийн мэдээлэл хүлээн авах → OTP явуулах
// POST /api/auth/register
// ============================================================
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, role, otpMethod } = req.body;
    // otpMethod: "email" | "phone"  (frontend-оос ирнэ, default: "email")
    const method = otpMethod || "email";

    // Монгол дугаарын validation
    const mnPhoneRegex = /^[789]\d{7}$/;
    if (!mnPhoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Зөвхөн Монгол улсын үүрэн телефоны дугаар оруулна уу (8 оронтой)",
      });
    }

    // Нууц үгийн урт шалгах
    if (password.length < 8) {
      return res.status(400).json({
        message: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой",
      });
    }

    // Давхардал шалгах
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({
        message: "Имэйл эсвэл утасны дугаар аль хэдийн бүртгэлтэй байна",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { firstName, lastName, phone, email, password: hashedPassword, role };

    if (method === "phone") {
      // SMS — Twilio Verify (өөрөө OTP үүсгэж явуулна, DB хэрэггүй)
      await sendSmsOtp({ phone, purpose: "register" });
    } else {
      // Email — Resend + DB-д хадгалах
      const otp = await createOtp({
        identifier: email,
        type: "email",
        purpose: "register",
        userData,
      });
      await sendEmailOtp({
        email,
        code: otp.code,
        purpose: "register",
        firstName,
      });
    }

    res.status(200).json({
      message: method === "phone"
        ? `OTP код +976${phone} утас руу илгээгдлээ. 5 минутын дотор оруулна уу.`
        : "OTP код таны имэйл рүү илгээгдлээ. 5 минутын дотор оруулна уу.",
      email,
      phone,
      otpMethod: method,
    });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({
      message: "Бүртгэл хийх үед алдаа гарлаа",
      error: error.message,
    });
  }
};

// ============================================================
// АЛХАМ 2: OTP баталгаажуулах → Хэрэглэгч үүсгэх
// POST /api/auth/verify-otp
// ============================================================
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, phone, code, otpMethod } = req.body;
    const method = otpMethod || "email";

    if (!code) {
      return res.status(400).json({ message: "OTP код шаардлагатай" });
    }

    let userData = null;

    if (method === "phone") {
      // Twilio Verify-аар шалгах
      const approved = await verifySmsOtp({ phone, code });
      if (!approved) {
        return res.status(400).json({ message: "OTP код буруу байна" });
      }
      // SMS хувилбарт userData-г req.body-оос авна
      // (frontend register үедээ localStorage-д хадгалсан)
      const { firstName, lastName, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      userData = { firstName, lastName, phone, email, password: hashedPassword, role };
    } else {
      // Email — DB-д хадгалсан OTP шалгах
      if (!email) {
        return res.status(400).json({ message: "Имэйл болон OTP код шаардлагатай" });
      }
      const result = await verifyOtp({ identifier: email, code, purpose: "register" });
      if (!result.valid) {
        return res.status(400).json({ message: result.message });
      }
      userData = result.userData;
    }

    // Давхардлыг дахин шалгах
    const existing = await User.findOne({
      $or: [{ email: userData.email }, { phone: userData.phone }],
    });
    if (existing) {
      return res.status(400).json({
        message: "Имэйл эсвэл утасны дугаар аль хэдийн бүртгэлтэй байна",
      });
    }

    // Хэрэглэгч үүсгэх
    const user = await User.create(userData);

    res.status(201).json({
      message: "Бүртгэл амжилттай баталгаажлаа! 🎉",
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone,
        email:     user.email,
        role:      user.role,
        avatar:    user.avatar || "",
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("verifyRegisterOtp error:", error);
    res.status(500).json({ message: "Баталгаажуулахад алдаа гарлаа", error: error.message });
  }
};

// ============================================================
// OTP дахин явуулах
// POST /api/auth/resend-otp
// ============================================================
exports.resendOtp = async (req, res) => {
  try {
    const { email, phone, purpose = "register", otpMethod } = req.body;
    const method = otpMethod || "email";

    if (method === "phone") {
      if (!phone) return res.status(400).json({ message: "Утасны дугаар шаардлагатай" });
      await sendSmsOtp({ phone, purpose });
      return res.json({ message: "OTP код дахин утас руу илгээгдлээ" });
    }

    // Email хувилбар — хуучин userData хадгалах
    if (!email) return res.status(400).json({ message: "Имэйл хаяг шаардлагатай" });

    const Otp = require("../models/Otp");
    const oldOtp = await Otp.findOne({ identifier: email, purpose, isUsed: false });
    if (!oldOtp) {
      return res.status(400).json({ message: "Бүртгэлийн мэдээлэл олдсонгүй. Дахин бүртгүүлнэ үү." });
    }

    const newOtp = await createOtp({
      identifier: email,
      type: "email",
      purpose,
      userData: oldOtp.userData,
    });

    await sendEmailOtp({
      email,
      code: newOtp.code,
      purpose,
      firstName: oldOtp.userData?.firstName,
    });

    res.json({ message: "OTP код дахин имэйл рүү илгээгдлээ" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ============================================================
// Нэвтрэх
// POST /api/auth/login
// ============================================================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Таны эрх хязгаарлагдсан байна" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });
    }

    res.json({
      message: "Амжилттай нэвтэрлээ",
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone,
        email:     user.email,
        role:      user.role,
        avatar:    user.avatar || "",
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Нэвтрэх үед алдаа гарлаа", error: error.message });
  }
};