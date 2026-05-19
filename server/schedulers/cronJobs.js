const cron = require("node-cron");
const { sendMonthlyReports, getLastWorkingDayOfMonth } = require("../services/reportService");
const { updateOverduePayments } = require("../controllers/paymentController");

function startSchedulers() {
  // ============================================================
  // 1. САРЫН ТАЙЛАН
  // Сар бүрийн сүүлийн ажлын өдрийн 09:00 цагт
  // Шаардлага №8-г хэрэгжүүлж байна
  // Cron: өдөр бүр 09:00-д шалгаж, сарын сүүлийн ажлын өдөр мөн бол явуулна
  // ============================================================
  cron.schedule("0 9 * * 1-5", async () => {
    const today   = new Date();
    const lastDay = getLastWorkingDayOfMonth();

    const isLastWorkingDay =
      today.getDate()  === lastDay.getDate() &&
      today.getMonth() === lastDay.getMonth();

    if (isLastWorkingDay) {
      console.log("📊 Сарын тайлан илгээж байна...");
      await sendMonthlyReports();
    }
  }, {
    timezone: "Asia/Ulaanbaatar",
  });

  // ============================================================
  // 2. ХУГАЦАА ХЭТЭРСЭН ТӨЛБӨР ШИНЭЧЛЭХ
  // Өдөр бүр шөнө дунд шалгах
  // ============================================================
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Хугацаа хэтэрсэн төлбөрүүд шинэчлэгдэж байна...");
    await updateOverduePayments();
  }, {
    timezone: "Asia/Ulaanbaatar",
  });

  console.log("✅ Scheduler ажиллаж эхэллээ (Asia/Ulaanbaatar)");
}

// Тест хийхэд гараар ажиллуулах
async function runReportNow() {
  console.log("🧪 Тайлан гараар ажиллуулж байна...");
  await sendMonthlyReports();
}

module.exports = { startSchedulers, runReportNow };