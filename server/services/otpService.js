// ═══════════════════════════════════════════════════════════════════
//  📁 server/services/otpService.js
//  ⭐ SMS gateway: Twilio Verify → EasySendSMS HTTP API
//  Имэйл (Resend) + DB-д суурилсан OTP storage хэвээр
// ═══════════════════════════════════════════════════════════════════

const crypto = require("crypto");
const { Resend } = require("resend");
const Otp = require("../models/Otp");

const resend = new Resend(process.env.RESEND_API_KEY);

// 6 оронтой санамсаргүй код үүсгэх
function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

// ═══════════════════════════════════════════════════════════════════
//  OTP CREATE / VERIFY  —  DB-д суурилсан, имэйл болон SMS-д НЭГТГЭЛТЭЙ
// ═══════════════════════════════════════════════════════════════════

/**
 * createOtp — 6 оронтой код үүсгэж, DB-д userData-тай хадгална.
 * Имэйл, SMS аль алинд нь ашиглана (EasySendSMS-ийн ачаар).
 * Буцаах: { code, identifier, purpose, ... } гэх OTP doc
 */
async function createOtp({ identifier, type, purpose, userData = null }) {
  // Энэ хэрэглэгчийн өмнөх ашиглагдаагүй OTP-уудыг устгана
  await Otp.deleteMany({ identifier, purpose, isUsed: false });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

  const otp = await Otp.create({
    identifier,
    type,           // "email" | "phone"
    purpose,        // "register" | "forgot_password"
    code,
    userData,
    expiresAt,
    isUsed: false,
  });

  return otp;
}

/**
 * verifyOtp — Кодыг DB-ээс шалгана. Зөв бол isUsed=true болгоно.
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
//  ИМЭЙЛ CHANNEL  —  Resend (өөрчлөлтгүй)
// ═══════════════════════════════════════════════════════════════════

async function sendEmailOtp({ email, code, purpose, firstName = "" }) {
  const subject =
    purpose === "forgot_password"
      ? "RentalSy — Нууц үг сэргээх код"
      : "RentalSy — Бүртгэлийн баталгаажуулах код";

  const greeting = firstName ? `Сайн байна уу ${firstName},` : "Сайн байна уу,";

  const purposeText =
    purpose === "forgot_password"
      ? "Нууц үгээ сэргээхийн тулд дараах кодыг оруулна уу:"
      : "Бүртгэлээ баталгаажуулахын тулд дараах кодыг оруулна уу:";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">RentalSy</h2>
      <p>${greeting}</p>
      <p>${purposeText}</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                  text-align: center; padding: 20px; background: #f3f4f6;
                  border-radius: 8px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">Код 5 минутын дотор хүчинтэй.</p>
      <p style="color: #666; font-size: 12px;">
        Хэрэв та энэ кодыг хүсээгүй бол энэ имэйлийг үл тоомсорлоно уу.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM || "RentalSy <noreply@rentalsy.mn>",
    to: email,
    subject,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════════
//  SMS CHANNEL  —  EasySendSMS HTTP API
//  ⭐ Twilio Verify-ийг бүхэлд нь сольсон
//  Doc: https://www.easysendsms.com/rest-api
// ═══════════════════════════════════════════════════════════════════

const ESS_BASE_URL = "https://restapi.easysendsms.app/v1/rest/sms/send";

/**
 * sendSmsOtp — DB-ээс үүсгэсэн кодыг EasySendSMS-ээр явуулна.
 * Twilio Verify шиг өөрөө код үүсгэдэггүй — гадуур үүсгэгдсэн кодыг л явуулна.
 *
 * @param {string} phone — 8 оронтой Монгол утас (+976 prefix-гүй)
 * @param {string} code  — createOtp()-ээс гарсан 6 оронтой код
 * @param {string} purpose — "register" | "forgot_password"
 */
async function sendSmsOtp({ phone, code, purpose }) {
  if (!process.env.EASYSENDSMS_API_KEY) {
    throw new Error("EASYSENDSMS_API_KEY .env-д тохируулагдаагүй байна");
  }

  // EasySendSMS бүрэн форматтай дугаар хүлээж авна: 976XXXXXXXX (+ тэмдэггүй)
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
    type: "0", // 0 = энгийн текст, 1 = unicode (тоо тэмдэгтийн хувьд 0 хангалттай)
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
  // ⭐ verifySmsOtp ҮГҮЙ БОЛСОН — verifyOtp-аар ерөнхий шалгана
};