const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createOtp, sendEmailOtp, verifyOtp } = require("../services/otpService");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ============================================================
// АЛХАМ 1: Бүртгэлийн мэдээлэл хүлээн авах → OTP явуулах
// POST /api/auth/register
// ============================================================
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, role } = req.body;

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

    // Хэрэглэгчийн мэдээллийг OTP-тэй хамт түр хадгалах
    const userData = { firstName, lastName, phone, email, password: hashedPassword, role };

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

    res.status(200).json({
      message: "OTP код таны имэйл рүү илгээгдлээ. 5 минутын дотор оруулна уу.",
      email, // frontend-д харуулахад хэрэгтэй
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
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Имэйл болон OTP код шаардлагатай" });
    }

    const result = await verifyOtp({ identifier: email, code, purpose: "register" });

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const { userData } = result;

    // Давхардлыг дахин шалгах (OTP хүлээх хугацаанд бүртгэсэн байж болно)
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
    const { email, purpose = "register" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Имэйл хаяг шаардлагатай" });
    }

    // Хуучин OTP-г авч userData-г хадгалах
    const Otp = require("../models/Otp");
    const oldOtp = await Otp.findOne({ identifier: email, purpose, isUsed: false });

    if (!oldOtp) {
      return res.status(400).json({ message: "Бүртгэлийн мэдээлэл олдсонгүй. Дахин бүртгүүлнэ үү." });
    }

    const { createOtp: co, sendEmailOtp: se } = require("../services/otpService");

    const newOtp = await co({
      identifier: email,
      type: "email",
      purpose,
      userData: oldOtp.userData,
    });

    await se({
      email,
      code: newOtp.code,
      purpose,
      firstName: oldOtp.userData?.firstName,
    });

    res.json({ message: "OTP код дахин илгээгдлээ" });
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