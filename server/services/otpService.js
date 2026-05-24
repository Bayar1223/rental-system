// ═══════════════════════════════════════════════════════════════════
//  📁 server/services/otpService.js
//  ⭐ Email: Nodemailer + Gmail (emailService.js-ийг wrap хийнэ)
//     SMS:   EasySendSMS HTTP API
// ═══════════════════════════════════════════════════════════════════

const crypto = require("crypto");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("./emailService");

// 6 оронтой санамсаргүй код үүсгэх
function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

// ═══════════════════════════════════════════════════════════════════
//  OTP CREATE / VERIFY  —  DB-д суурилсан (имэйл болон SMS-д нэгтгэлтэй)
// ═══════════════════════════════════════════════════════════════════

/**
 * createOtp — 6 оронтой код үүсгэж DB-д userData-тай хадгална.
 * Буцаах: { code, identifier, purpose, ... }
 */
async function createOtp({ identifier, type, purpose, userData = null }) {
  await Otp.deleteMany({ identifier, purpose, isUsed: false });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

  const otp = await Otp.create({
    identifier,
    type,           // "email" | "phone"
    purpose,        // "register" | "forgot_password" | "payment"
    code,
    userData,
    expiresAt,
    isUsed: false,
  });

  return otp;
}

/**
 * verifyOtp — Кодыг DB-ээс шалгаж, зөв бол isUsed=true болгоно.
 * Буцаах: { valid: bool, message?: string, userData?: object }
 */
async function verifyOtp({ identifier, code, purpose }) {
  const otp = await Otp.findOne({
    identifier,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otp) {
    return { valid: false, message: "OTP олдсонгүй. Дахин илгээнэ үү." };
  }

  if (otp.expiresAt < new Date()) {
    return { valid: false, message: "OTP-ийн хугацаа дууссан байна. Дахин илгээнэ үү." };
  }

  if (otp.code !== code) {
    return { valid: false, message: "OTP код буруу байна." };
  }

  otp.isUsed = true;
  await otp.save();

  return { valid: true, userData: otp.userData };
}

// ═══════════════════════════════════════════════════════════════════
//  EMAIL CHANNEL  —  Nodemailer + Gmail
//  emailService.sendOtpEmail-ийг хүлээж avна
// ═══════════════════════════════════════════════════════════════════

async function sendEmailOtp({ email, code, purpose, firstName = "" }) {
  await sendOtpEmail({ to: email, code, purpose, firstName });
}

// ═══════════════════════════════════════════════════════════════════
//  SMS CHANNEL  —  EasySendSMS HTTP API
//  Doc: https://www.easysendsms.com/rest-api
// ═══════════════════════════════════════════════════════════════════

const ESS_BASE_URL = "https://restapi.easysendsms.app/v1/rest/sms/send";

async function sendSmsOtp({ phone, code, purpose }) {
  if (!process.env.EASYSENDSMS_API_KEY) {
    throw new Error("EASYSENDSMS_API_KEY .env-д тохируулагдаагүй байна");
  }

  // EasySendSMS бүрэн форматтай дугаар хүлээж авна: 976XXXXXXXX
  const cleaned = String(phone).replace(/\D/g, "");
  const to = cleaned.startsWith("976") ? cleaned : `976${cleaned}`;

  const purposeText =
    purpose === "forgot_password"
      ? "Нууц үг сэргээх код"
      : "Баталгаажуулах код";

  const text = `RentalSy: ${purposeText}: ${code}. Хугацаа 5 минут.`;

  const body = {
    from: process.env.EASYSENDSMS_SENDER || "RentalSy",
    to,
    text,
    type: "0", // 0 = энгийн текст
  };

  const response = await fetch(ESS_BASE_URL, {
    method: "POST",
    headers: {
      apikey: process.env.EASYSENDSMS_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("EasySendSMS алдаа:", response.status, errorText);
    throw new Error(`SMS илгээж чадсангүй (HTTP ${response.status})`);
  }

  const result = await response.json();
  console.log("EasySendSMS амжилттай:", result);
  return result;
}

module.exports = {
  createOtp,
  verifyOtp,
  sendEmailOtp,
  sendSmsOtp,
};