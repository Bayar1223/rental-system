const Application = require("../models/Application");
const { createNotification } = require("../controllers/notificationController");
const { sendLeaseExpiryEmail } = require("./emailService");

// Түрээс дуусах хугацааны сануулга явуулах
// 30, 14, 7 хоногийн өмнө
async function sendLeaseExpiryReminders() {
  const now = new Date();
  console.log("🏠 Түрээс дуусах сануулга шалгаж байна...");

  const REMINDER_DAYS = [30, 14, 7];
  let sentCount = 0;

  for (const days of REMINDER_DAYS) {
    // Яг өнөөдрөөс X хоногийн дараа дуусах гэрээнүүд
    const targetStart = new Date(now);
    targetStart.setDate(targetStart.getDate() + days);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(targetStart);
    targetEnd.setHours(23, 59, 59, 999);

    const expiringRentals = await Application.find({
      status: "approved",
      contractStatus: { $in: ["signed", "payment_pending", "active"] },
      endDate: { $gte: targetStart, $lte: targetEnd },
    })
      .populate("property", "title location monthlyRent")
      .populate("tenant",   "firstName lastName email _id")
      .populate("landlord", "firstName lastName email _id");

    for (const rental of expiringRentals) {
      try {
        const endDate = new Date(rental.endDate).toLocaleDateString("mn-MN", {
          year: "numeric", month: "long", day: "numeric",
        });

        // Tenant-д мэдэгдэл
        await createNotification({
          user:    rental.tenant._id,
          title:   `⚠️ Түрээс ${days} хоногт дуусна`,
          message: `"${rental.property.title}" байрны түрээсийн гэрээ ${endDate}-нд дуусна. Сунгах эсэхээ шийдэж, түрээслүүлэгчтэй холбогдоно уу.`,
          type:    "general",
          link:    "/my-rentals",
        });

        // Landlord-д мэдэгдэл
        await createNotification({
          user:    rental.landlord._id,
          title:   `⚠️ Түрээс ${days} хоногт дуусна`,
          message: `${rental.tenant.firstName} ${rental.tenant.lastName}-ийн түрээсийн гэрээ "${rental.property.title}" байранд ${endDate}-нд дуусна.`,
          type:    "general",
          link:    "/my-rentals",
        });

        // Email сануулга
        await sendLeaseExpiryEmail({
          to:        rental.tenant.email,
          firstName: rental.tenant.firstName,
          role:      "tenant",
          days,
          endDate,
          propertyTitle: rental.property.title,
        });

        await sendLeaseExpiryEmail({
          to:        rental.landlord.email,
          firstName: rental.landlord.firstName,
          role:      "landlord",
          days,
          endDate,
          propertyTitle: rental.property.title,
          tenantName:    `${rental.tenant.firstName} ${rental.tenant.lastName}`,
        });

        sentCount++;
      } catch (err) {
        console.error(`Lease expiry reminder алдаа [${rental._id}]:`, err.message);
      }
    }
  }

  console.log(`✅ Түрээс дуусах сануулга: ${sentCount} гэрээнд явуулав`);
}

module.exports = { sendLeaseExpiryReminders };