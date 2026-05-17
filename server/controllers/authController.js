const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Имэйл эсвэл утасны дугаар бүртгэлтэй байна",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "Хэрэглэгч амжилттай бүртгэгдлээ",
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        phone:     user.phone,
        email:     user.email,
        role:      user.role,
        avatar:    user.avatar || "", // ← НЭМСЭН
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Бүртгэл хийх үед алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Имэйл эсвэл нууц үг буруу байна",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Имэйл эсвэл нууц үг буруу байна",
      });
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
        avatar:    user.avatar || "", // ← НЭМСЭН
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Нэвтрэх үед алдаа гарлаа",
      error: error.message,
    });
  }
};