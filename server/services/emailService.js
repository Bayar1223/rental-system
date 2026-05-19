const nodemailer = require("nodemailer");

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// OTP имэйл илгээх
exports.sendOtpEmail = async ({ to, code, purpose, firstName }) => {
  const purposeText = {
    register:         "бүртгэл баталгаажуулах",
    payment:          "төлбөр баталгаажуулах",
    forgot_password:  "нууц үг сэргээх",
  }[purpose] || "баталгаажуулах";

  await transporter.sendMail({
    from: `"Түрээсийн систем" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Баталгаажуулах код: ${code}`,
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
        <p style="color: #6b7280; font-size: 14px;">⏰ Энэ код <b>5 минут</b>ын дотор хүчинтэй.</p>
        <p style="color: #9ca3af; font-size: 12px;">
          Хэрэв та энэ хүсэлт илгээгээгүй бол үл тоомсорлоно уу.
        </p>
      </div>
    `,
  });
};

// Сарын тайлан имэйл
exports.sendMonthlyReportEmail = async ({ to, firstName, role, monthName, report }) => {
  const { summary } = report;

  const landlordRows = role === "landlord" ? report.payments
    .filter(p => p.status === "paid")
    .map(p => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${p.property?.title || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${p.tenant?.firstName} ${p.tenant?.lastName || ""}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right;color:#059669;font-weight:bold">
          ${p.totalAmount?.toLocaleString()}₮
        </td>
      </tr>
    `).join("") : "";

  const tenantRows = role === "tenant" ? report.payments
    .map(p => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${p.paymentNumber}-р төлбөр</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6">${p.property?.title || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right">
          <span style="color:${p.status==='paid'?'#059669':p.status==='overdue'?'#dc2626':'#d97706'};font-weight:bold">
            ${p.status==='paid'?'Төлөгдсөн ✓':p.status==='overdue'?'Хоцорсон ⚠️':'Хүлээгдэж байна'}
          </span>
        </td>
        <td style="padding:8px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:bold">
          ${p.totalAmount?.toLocaleString()}₮
        </td>
      </tr>
    `).join("") : "";

  const html = role === "landlord" ? `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#4f46e5">🏡 Түрээсийн систем — ${monthName} сарын тайлан</h2>
      <p>Сайн байна уу, <b>${firstName}</b>!</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#059669">${summary.totalIncome?.toLocaleString()}₮</div>
          <div style="color:#6b7280;font-size:13px;margin-top:4px">Нийт орлого</div>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#4f46e5">${summary.activeRentalCount}</div>
          <div style="color:#6b7280;font-size:13px;margin-top:4px">Идэвхтэй түрээс</div>
        </div>
        <div style="background:#fef9c3;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#ca8a04">${summary.pendingCount}</div>
          <div style="color:#6b7280;font-size:13px;margin-top:4px">Хүлээгдэж буй</div>
        </div>
        <div style="background:#fef2f2;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:bold;color:#dc2626">${summary.overdueCount}</div>
          <div style="color:#6b7280;font-size:13px;margin-top:4px">Хоцорсон</div>
        </div>
      </div>

      ${landlordRows ? `
        <h3 style="color:#374151">Төлөгдсөн төлбөрүүд</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left">Байр</th>
              <th style="padding:8px;text-align:left">Түрээслэгч</th>
              <th style="padding:8px;text-align:right">Дүн</th>
            </tr>
          </thead>
          <tbody>${landlordRows}</tbody>
        </table>
      ` : "<p style='color:#6b7280'>Энэ сард төлөгдсөн төлбөр байхгүй байна.</p>"}

      <p style="color:#9ca3af;font-size:12px;margin-top:24px">
        © 2026 Түрээсийн систем — Автомат тайлан
      </p>
    </div>
  ` : `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#4f46e5">🏡 Түрээсийн систем — ${monthName} сарын тайлан</h2>
      <p>Сайн байна уу, <b>${firstName}</b>!</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#059669">${summary.totalPaid?.toLocaleString()}₮</div>
          <div style="color:#6b7280;font-size:13px;margin-top:4px">Нийт төлсөн</div>
        </div>
        <div style="background:#fef2f2;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#dc2626">${summary.overdueCount}</div>
          <div style="color:#6b7280;font-size:13px;margin-top:4px">Хоцорсон</div>
        </div>
      </div>

      ${summary.nextPaymentCount > 0 ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:16px 0">
          ⏰ Дараагийн төлбөр: <b>${summary.nextPaymentAmount?.toLocaleString()}₮</b>
        </div>
      ` : ""}

      <h3 style="color:#374151">Төлбөрийн дэлгэрэнгүй</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px;text-align:left">#</th>
            <th style="padding:8px;text-align:left">Байр</th>
            <th style="padding:8px;text-align:left">Төлөв</th>
            <th style="padding:8px;text-align:right">Дүн</th>
          </tr>
        </thead>
        <tbody>${tenantRows}</tbody>
      </table>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px">
        © 2026 Түрээсийн систем — Автомат тайлан
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Түрээсийн систем" <${process.env.GMAIL_USER}>`,
    to,
    subject: `📊 ${monthName} сарын тайлан — Түрээсийн систем`,
    html,
  });
};

// Нууц үг сэргээх имэйл
exports.sendPasswordResetEmail = async ({ to, resetToken, firstName }) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"Түрээсийн систем" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Нууц үг сэргээх хүсэлт",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">🏡 Түрээсийн систем</h2>
        <p>Сайн байна уу${firstName ? `, <b>${firstName}</b>` : ""}!</p>
        <p>Нууц үг сэргээх холбоос:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="
            background-color: #4f46e5; color: white;
            padding: 14px 32px; text-decoration: none;
            border-radius: 12px; font-size: 16px; font-weight: bold;
          ">Нууц үг шинэчлэх →</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">⏰ Холбоос <b>1 цаг</b>ийн дотор хүчинтэй.</p>
      </div>
    `,
  });
};