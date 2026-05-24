const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyRegisterOtp,
  resendOtp,
  loginUser,
} = require("../controllers/authController");

// Бүртгэл — 2 алхамтай
router.post("/register",     registerUser);       // Алхам 1: мэдээлэл → OTP явуулах
router.post("/verify-otp",   verifyRegisterOtp);  // Алхам 2: OTP → бүртгэл дуусгах
router.post("/resend-otp",   resendOtp);          // OTP дахин явуулах

// Нэвтрэх
router.post("/login",        loginUser);

// ⭐ Нууц үг сэргээх endpoint-ууд /api/password-reset/* дээр шилжсэн
//    (server/routes/passwordResetRoutes.js файлд тусдаа байна)

module.exports = router;