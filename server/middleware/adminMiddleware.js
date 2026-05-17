const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminOnly = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token байхгүй" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
    if (user.role !== "admin") return res.status(403).json({ message: "Зөвхөн админ хандах боломжтой" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token буруу" });
  }
};

module.exports = { adminOnly };