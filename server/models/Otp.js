const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // имэйл эсвэл утасны дугаар
  type: {
    type: String,
    enum: ["email", "phone"],
    required: true,
  },
  code: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["register", "payment", "forgot_password"],
    default: "register",
  },
  // Бүртгэлийн үед хэрэглэгчийн мэдээллийг түр хадгалах
  userData: { type: Object, default: null },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Хугацаа дуусмагц автоматаар устгах
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);