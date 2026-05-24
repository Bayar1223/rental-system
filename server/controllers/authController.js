// ═══════════════════════════════════════════════════════════════════
//  📁 server/controllers/authController.js
//  ⭐ EasySendSMS-ийн дараах БҮРЭН зассан хувилбар
//
//  Өөрчлөлтүүд:
//  - Imports-аас verifySmsOtp хасагдсан (Twilio-той хамт алга болсон)
//  - SMS болон имэйл нэг flow-р явна:
//      createOtp() → channel-аар явуулах → verifyOtp()
//  - Phase 2-ийн SMS-д зориулсан тойруу логик (Twilio Verify
//    үед userData-ыг тусад нь DB-д хадгалж байсан) бүрэн алга болсон
//  - verifyRegisterOtp 80+ мөр → ~40 мөр болж буурсан
// ═══════════════════════════════════════════════════════════════════

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createOtp,
  sendEmailOtp,
  sendSmsOtp,
  verifyOtp,
  // ⭐ verifySmsOtp устгасан — verifyOtp-аар ерөнхий шалгана
} = require("../services/otpService");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const MN_PHONE_REGEX = /^[789]\d{7}$/;

// ─────────────────────────────────────────────────────────────────────
//  Туслах функцууд
// ─────────────────────────────────────────────────────────────────────

// "+976" prefix-ийг хасаж 8 оронтой цэвэр дугаар буцаана
function normalizePhone(raw) {
  if (!raw) return "";
  return String(raw).replace(/^\+?976/, "").replace(/\D/g, "").slice(0, 8);
}

// "Бат Эрдэнэ" → { firstName: "Бат", lastName: "Эрдэнэ" }
function splitName(name) {
  if (!name || typeof name !== "string") return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

// Client-д буцаах user object — `_id` болон `name` virtual хоюуланг агуулна
function formatUser(user) {
  return {
    _id:       user._id,
    name:      user.name || `${user.firstName} ${user.lastName || ""}`.trim(),
    firstName: user.firstName,
    lastName:  user.lastName || "",
    phone:     user.phone,
    email:     user.email,
    role:      user.role,
    avatar:    user.avatar || "",
  };
}

// ═══════════════════════════════════════════════════════════════════
//  АЛХАМ 1 — Бүртгэлийн мэдээлэл хүлээж OTP илгээх
// ═══════════════════════════════════════════════════════════════════
exports.registerUser = async (req, res) => {
  try {
    let { firstName, lastName, name, phone, email, password, role, otpMethod } = req.body;
    const method = otpMethod || "email";

    // Client `name` нэрээр нийтэд явуулсан бол firstName/lastName-руу хуваана
    if (!firstName && name) {
      const split = splitName(name);
      firstName = split.firstName;
      lastName  = lastName || split.lastName;
    }

    phone = normalizePhone(phone);

    if (!firstName || !phone || !email || !password) {
      return res.status(400).json({
        message: "Бүх талбарыг бөглөнө үү (нэр, утас, имэйл, нууц үг)",
      });
    }

    if (!MN_PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        message: "Зөвхөн Монгол улсын үүрэн телефоны дугаар оруулна уу (8 оронтой)",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой",
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({
        message: "Имэйл эсвэл утасны дугаар аль хэдийн бүртгэлтэй байна",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      firstName,
      lastName: lastName || "",
      phone,
      email,
      password: hashedPassword,
      role,
    };

    // ⭐ EasySendSMS-ийн дараах НЭГТГЭЛТ — хоёр сувган дээр ижил flow
    if (method === "phone") {
      const otp = await createOtp({
        identifier: phone,
        type: "phone",
        purpose: "register",
        userData,
      });
      await sendSmsOtp({ phone, code: otp.code, purpose: "register" });
    } else {
      const otp = await createOtp({
        identifier: email,
        type: "email",
        purpose: "register",
        userData,
      });
      await sendEmailOtp({ email, code: otp.code, purpose: "register", firstName });
    }

    res.status(200).json({
      message:
        method === "phone"
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

// ═══════════════════════════════════════════════════════════════════
//  АЛХАМ 2 — OTP баталгаажуулж хэрэглэгч үүсгэх
//  ⭐ SMS болон имэйл салбар нэг flow-р явна
// ═══════════════════════════════════════════════════════════════════
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    let { phone } = req.body;
    // Client `code` эсвэл `otpCode` нэрээр явуулдаг — аль ч нэрийг хүлээж авна
    const code   = req.body.code     || req.body.otpCode;
    const method = req.body.otpMethod || req.body.method || "email";

    if (!code) {
      return res.status(400).json({ message: "OTP код шаардлагатай" });
    }

    // identifier — имэйл эсвэл утас аль нь ч байсан DB-ийн ижил хэлбэрээр шалгана
    let identifier;
    if (method === "phone") {
      phone = normalizePhone(phone);
      identifier = phone;
      if (!identifier) {
        return res.status(400).json({ message: "Утасны дугаар шаардлагатай" });
      }
    } else {
      identifier = email;
      if (!identifier) {
        return res.status(400).json({ message: "Имэйл шаардлагатай" });
      }
    }

    // ⭐ Нэгдсэн verifyOtp — DB-ээс код шалгаж userData-ыг буцаана
    const result = await verifyOtp({ identifier, code, purpose: "register" });
    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const userData = result.userData;
    if (!userData) {
      return res.status(400).json({
        message: "Бүртгэлийн мэдээлэл олдсонгүй. Дахин бүртгүүлнэ үү.",
      });
    }

    // Давхардал шалгах (verifyOtp-ийн дараа хэн нэгэн бүртгүүлсэн байж магадгүй)
    const existing = await User.findOne({
      $or: [{ email: userData.email }, { phone: userData.phone }],
    });
    if (existing) {
      return res.status(400).json({
        message: "Имэйл эсвэл утасны дугаар аль хэдийн бүртгэлтэй байна",
      });
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: "Бүртгэл амжилттай баталгаажлаа! 🎉",
      user: formatUser(user),         // ⭐ `_id` + `name` virtual
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("verifyRegisterOtp error:", error);
    res.status(500).json({
      message: "Баталгаажуулахад алдаа гарлаа",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  OTP дахин илгээх — имэйл болон утасны сувганд нэгдсэн
// ═══════════════════════════════════════════════════════════════════
exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose = "register", otpMethod } = req.body;
    let { phone } = req.body;
    const method = otpMethod || "email";

    let identifier;
    if (method === "phone") {
      phone = normalizePhone(phone);
      identifier = phone;
      if (!identifier) {
        return res.status(400).json({ message: "Утасны дугаар шаардлагатай" });
      }
    } else {
      identifier = email;
      if (!identifier) {
        return res.status(400).json({ message: "Имэйл хаяг шаардлагатай" });
      }
    }

    // Хуучин OTP-ийн userData-г олж авна
    const Otp = require("../models/Otp");
    const oldOtp = await Otp.findOne({ identifier, purpose, isUsed: false });
    if (!oldOtp) {
      return res.status(400).json({
        message: "Бүртгэлийн мэдээлэл олдсонгүй. Дахин бүртгүүлнэ үү.",
      });
    }

    // Шинэ код үүсгэх (хуучин userData-тай хадгална)
    const newOtp = await createOtp({
      identifier,
      type: method === "phone" ? "phone" : "email",
      purpose,
      userData: oldOtp.userData,
    });

    // Сонгосон сувгаар явуулах
    if (method === "phone") {
      await sendSmsOtp({ phone: identifier, code: newOtp.code, purpose });
      return res.json({ message: "OTP код дахин утас руу илгээгдлээ" });
    } else {
      await sendEmailOtp({
        email: identifier,
        code: newOtp.code,
        purpose,
        firstName: oldOtp.userData?.firstName,
      });
      return res.json({ message: "OTP код дахин имэйл рүү илгээгдлээ" });
    }
  } catch (error) {
    console.error("resendOtp error:", error);
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
//  Нэвтрэх
// ═══════════════════════════════════════════════════════════════════
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Имэйл болон нууц үг шаардлагатай",
      });
    }

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
      user: formatUser(user),         // ⭐ `_id` + `name` virtual
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({
      message: "Нэвтрэх үед алдаа гарлаа",
      error: error.message,
    });
  }
};