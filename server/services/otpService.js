const { Resend } = require("resend");
const Otp = require("../models/Otp");

const resend = new Resend(process.env.RESEND_API_KEY);

// 6 оронтой OTP үүсгэх
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP үүсгэж DB-д хадгалах
async function createOtp({ identifier, type, purpose, userData = null }) {
  // Хуучин OTP-г устгах
  await Otp.deleteMany({ identifier, purpose });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

  const otp = await Otp.create({
    identifier,
    type,
    code,
    purpose,
    userData,
    expiresAt,
  });

  return otp;
}

// Email OTP илгээх
async function sendEmailOtp({ email, code, purpose, firstName }) {
  const purposeText = {
    register: "бүртгэл баталгаажуулах",
    payment: "төлбөр баталгаажуулах",
    forgot_password: "нууц үг сэргээх",
  }[purpose] || "баталгаажуулах";

  await resend.emails.send({
    from: "Түрээсийн систем <onboarding@resend.dev>",
    to: process.env.RESEND_TEST_EMAIL || email,
    subject: `OTP код — ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5;">🏡 Түрээсийн систем</h2>
        </div>
        <p>Сайн байна уу${firstName ? `, <b>${firstName}</b>` : ""}!</p>
        <p>Таны <b>${purposeText}</b> OTP код:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #4f46e5;
            background: #ede9ff;
            padding: 16px 32px;
            border-radius: 12px;
            display: inline-block;
          ">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          ⏰ Энэ код <b>5 минут</b>ын дотор хүчинтэй.
        </p>
        <p style="color: #9ca3af; font-size: 12px;">
          Хэрэв та энэ хүсэлт илгээгээгүй бол үл тоомсорлоно уу.
        </p>
      </div>
    `,
  });
}

// OTP шалгах
async function verifyOtp({ identifier, code, purpose }) {
  const otp = await Otp.findOne({
    identifier,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    return { valid: false, message: "OTP код олдсонгүй эсвэл хугацаа дууссан" };
  }

  if (otp.code !== code) {
    return { valid: false, message: "OTP код буруу байна" };
  }

  // Ашигласан гэж тэмдэглэх
  otp.isUsed = true;
  await otp.save();

  return { valid: true, userData: otp.userData };
}

module.exports = {
  createOtp,
  sendEmailOtp,
  verifyOtp,
  generateOtpCode,
};