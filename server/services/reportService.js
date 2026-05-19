const Payment     = require("../models/Payment");
const Application = require("../models/Application");
const User        = require("../models/User");
const { sendMonthlyReportEmail } = require("./emailService");

// Сарын сүүлийн ажлын өдрийг тодорхойлох
function getLastWorkingDayOfMonth(date = new Date()) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  // Дараа сарын 1-нээс өмнөх өдөр = энэ сарын сүүлийн өдөр
  let lastDay = new Date(year, month + 1, 0);
  // Бямба(6), Ням(0) бол өмнөх ажлын өдөр рүү буцах
  while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay;
}

// Тухайн сарын эхлэл, төгсгөлийг авах
function getMonthRange(date = new Date()) {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0);
  const end   = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

// Landlord-д зориулсан тайлан үүсгэх
async function generateLandlordReport(landlordId, monthRange) {
  const { start, end } = monthRange;

  // Тухайн сарын төлбөрүүд
  const payments = await Payment.find({
    landlord: landlordId,
    createdAt: { $gte: start, $lte: end },
  })
    .populate("property", "title location monthlyRent")
    .populate("tenant", "firstName lastName phone")
    .sort({ createdAt: 1 });

  // Идэвхтэй түрээснүүд
  const activeRentals = await Application.find({
    landlord: landlordId,
    status: "approved",
    contractStatus: { $in: ["signed", "payment_pending", "active"] },
  }).populate("property", "title monthlyRent").populate("tenant", "firstName lastName");

  // Тооцоо
  const totalRent      = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.rentAmount, 0);
  const totalDeposit   = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.depositAmount || 0), 0);
  const totalIncome    = totalRent + totalDeposit;
  const paidCount      = payments.filter(p => p.status === "paid").length;
  const overdueCount   = payments.filter(p => p.status === "overdue").length;
  const pendingCount   = payments.filter(p => ["pending", "urgent"].includes(p.status)).length;

  return {
    payments,
    activeRentals,
    summary: {
      totalIncome,
      totalRent,
      totalDeposit,
      paidCount,
      overdueCount,
      pendingCount,
      activeRentalCount: activeRentals.length,
    },
  };
}

// Tenant-д зориулсан тайлан үүсгэх
async function generateTenantReport(tenantId, monthRange) {
  const { start, end } = monthRange;

  const payments = await Payment.find({
    tenant: tenantId,
    createdAt: { $gte: start, $lte: end },
  })
    .populate("property", "title location monthlyRent")
    .sort({ createdAt: 1 });

  const totalPaid    = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.totalAmount, 0);
  const overdueCount = payments.filter(p => p.status === "overdue").length;
  const nextPayments = payments.filter(p => ["pending", "urgent"].includes(p.status));

  return {
    payments,
    summary: {
      totalPaid,
      overdueCount,
      nextPaymentCount: nextPayments.length,
      nextPaymentAmount: nextPayments.reduce((s, p) => s + p.totalAmount, 0),
    },
  };
}

// Бүх хэрэглэгчдэд тайлан явуулах үндсэн функц
async function sendMonthlyReports() {
  const now       = new Date();
  const monthRange = getMonthRange(now);
  const monthName  = now.toLocaleDateString("mn-MN", { year: "numeric", month: "long" });

  console.log(`📊 Сарын тайлан эхэлж байна: ${monthName}`);

  try {
    // Landlord-уудад тайлан явуулах
    const landlords = await User.find({ role: "landlord" });
    let sentCount = 0;

    for (const landlord of landlords) {
      try {
        const report = await generateLandlordReport(landlord._id, monthRange);
        if (report.summary.activeRentalCount === 0) continue; // Идэвхтэй түрээс байхгүй бол алгасах

        await sendMonthlyReportEmail({
          to:        landlord.email,
          firstName: landlord.firstName,
          role:      "landlord",
          monthName,
          report,
        });
        sentCount++;
      } catch (err) {
        console.error(`Landlord тайлан алдаа [${landlord.email}]:`, err.message);
      }
    }

    // Tenant-уудад тайлан явуулах
    const tenants = await User.find({ role: "tenant" });

    for (const tenant of tenants) {
      try {
        const report = await generateTenantReport(tenant._id, monthRange);
        if (report.payments.length === 0) continue; // Төлбөр байхгүй бол алгасах

        await sendMonthlyReportEmail({
          to:        tenant.email,
          firstName: tenant.firstName,
          role:      "tenant",
          monthName,
          report,
        });
        sentCount++;
      } catch (err) {
        console.error(`Tenant тайлан алдаа [${tenant.email}]:`, err.message);
      }
    }

    console.log(`✅ Сарын тайлан дуусав: ${sentCount} имэйл илгээгдлээ`);
  } catch (err) {
    console.error("Сарын тайлан алдаа:", err.message);
  }
}

module.exports = { sendMonthlyReports, getLastWorkingDayOfMonth, generateLandlordReport, generateTenantReport };