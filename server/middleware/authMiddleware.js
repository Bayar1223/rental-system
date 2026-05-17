const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      // ← НЭМСЭН: Блоклогдсон хэрэглэгчийг шалгах
      if (req.user.isBlocked) {
        return res.status(403).json({ message: "Таны эрх хязгаарлагдсан байна. Админтай холбогдоно уу." });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Token буруу байна" });
    }
  }

  return res.status(401).json({ message: "Нэвтрээгүй байна" });
};

module.exports = { protect };