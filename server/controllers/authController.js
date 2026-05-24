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

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const MN_PHONE_REGEX = /^[789]\d{7}$/;

// ── Туслах функцууд ──

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

// Client-д буцаах user object — `_id` болон `name` virtual хоёуланг агуулна
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

// АЛХАМ 1 — Бүртгэлийн мэдээлэл хүлээж OTP илгээх
exports.registerUser = async (req, res) => {
  try {
    let { firstName, lastName, name, phone, email, password, role, otpMethod } = req.body;
    const method = otpMethod || "email";

    // Client `name` нэрээр явуулсан бол хуваах
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

    if (method === "phone") {
      await sendSmsOtp({ phone, purpose: "register" });
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
    res.status(500).json({ message: "Бүртгэл хийх үед алдаа гарлаа", error: error.message });
  }
};

// АЛХАМ 2 — OTP баталгаажуулж хэрэглэгч үүсгэх
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    let { phone } = req.body;
    // Client `code` эсвэл `otpCode` нэрээр явуулдаг — аль ч нэрийг хүлээж авна
    const code   = req.body.code   || req.body.otpCode;
    const method = req.body.otpMethod || req.body.method || "email";

    if (!code) {
      return res.status(400).json({ message: "OTP код шаардлагатай" });
    }

    let userData = null;

    if (method === "phone") {
      phone = normalizePhone(phone);
      if (!phone) {
        return res.status(400).json({ message: "Утасны дугаар шаардлагатай" });
      }

      const approved = await verifySmsOtp({ phone, code });
      if (!approved) {
        return res.status(400).json({ message: "OTP код буруу байна" });
      }

      let { firstName, lastName, name, password, role } = req.body;
      if (!firstName && name) {
        const split = splitName(name);
        firstName = split.firstName;
        lastName  = lastName || split.lastName;
      }

      if (!firstName || !email || !password) {
        return res.status(400).json({
          message: "Бүртгэлийн мэдээлэл дутуу байна. Дахин бүртгүүлнэ үү.",
        });
      }
      if (!MN_PHONE_REGEX.test(phone)) {
        return res.status(400).json({ message: "Утасны дугаарын формат буруу байна" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      userData = { firstName, lastName: lastName || "", phone, email, password: hashedPassword, role };
    } else {
      if (!email) {
        return res.status(400).json({ message: "Имэйл болон OTP код шаардлагатай" });
      }
      const result = await verifyOtp({ identifier: email, code, purpose: "register" });
      if (!result.valid) return res.status(400).json({ message: result.message });
      userData = result.userData;
    }

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
    res.status(500).json({ message: "Баталгаажуулахад алдаа гарлаа", error: error.message });
  }
};

// OTP дахин илгээх
exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose = "register", otpMethod } = req.body;
    let { phone } = req.body;
    const method = otpMethod || "email";

    if (method === "phone") {
      phone = normalizePhone(phone);
      if (!phone) return res.status(400).json({ message: "Утасны дугаар шаардлагатай" });
      await sendSmsOtp({ phone, purpose });
      return res.json({ message: "OTP код дахин утас руу илгээгдлээ" });
    }

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

    await sendEmailOtp({ email, code: newOtp.code, purpose, firstName: oldOtp.userData?.firstName });

    res.json({ message: "OTP код дахин имэйл рүү илгээгдлээ" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// Нэвтрэх
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Имэйл болон нууц үг шаардлагатай" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });
    if (user.isBlocked) return res.status(403).json({ message: "Таны эрх хязгаарлагдсан байна" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Имэйл эсвэл нууц үг буруу байна" });

    res.json({
      message: "Амжилттай нэвтэрлээ",
      user: formatUser(user),         // ⭐ `_id` + `name` virtual
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Нэвтрэх үед алдаа гарлаа", error: error.message });
  }
};