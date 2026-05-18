const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendPasswordResetEmail = async ({ to, resetToken, firstName }) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from:    "Түрээсийн систем <onboarding@resend.dev>",
    to,
    subject: "Нууц үг сэргээх хүсэлт",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5;">🏡 Түрээсийн систем</h1>
        </div>
        <h2 style="color: #1f2937;">Сайн байна уу, ${firstName}!</h2>
        <p style="color: #6b7280; line-height: 1.6;">
          Таны нууц үг сэргээх хүсэлтийг хүлээн авлаа.
          Доорх товчлуур дарж нууц үгээ шинэчлэнэ үү.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
            style="background-color: #4f46e5; color: white; padding: 14px 32px;
                   text-decoration: none; border-radius: 12px; font-size: 16px;
                   font-weight: bold; display: inline-block;">
            Нууц үг шинэчлэх →
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">
          ⏰ Энэ холбоос <strong>1 цагийн</strong> дотор хүчинтэй байна.
        </p>
        <p style="color: #9ca3af; font-size: 14px;">
          Хэрэв та энэ хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © 2026 Түрээсийн систем. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    `,
  });
};