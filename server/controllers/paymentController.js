const Payment = require("../models/Payment");
const Application = require("../models/Application");
const { createNotification } = require("./notificationController");

// ======================================================
// Төлбөрийн нөхцөлийг задлах utility
// "6+1" => { months: 6, deposit: 1 }
// "Барьцаа байхгүй" => { months: 1, deposit: 0 }
// ======================================================
function parsePaymentCondition(conditionText) {
  if (!conditionText || conditionText === "Барьцаа байхгүй") {
    return { months: 1, deposit: 0 };
  }
  const match = conditionText.match(/^(\d+)\+(\d+)$/);
  if (match) {
    return {
      months:  parseInt(match[1]),
      deposit: parseInt(match[2]),
    };
  }
  return { months: 1, deposit: 0 };
}

// ======================================================
// Гэрээ баталгаажсаны дараа төлбөрүүд автоматаар үүсгэх
// ======================================================
exports.generatePayments = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId)
      .populate("property")
      .populate("tenant")
      .populate("landlord");

    if (!application) return;

    // Аль хэдийн үүсгэсэн бол дахин үүсгэхгүй
    const existing = await Payment.countDocuments({ application: applicationId });
    if (existing > 0) return;

    const { property, tenant, landlord, startDate, leaseMonths } = application;
    const monthlyRent   = property.monthlyRent;
    const conditionText = property.paymentConditionText || "Барьцаа байхгүй";

    const { months: periodMonths, deposit: depositMonths } =
      parsePaymentCondition(conditionText);

    const payments = [];
    let currentDate    = new Date(startDate);
    let paymentNumber  = 1;
    let remainingMonths = leaseMonths;

    while (remainingMonths > 0) {
      const isFirst          = paymentNumber === 1;
      const thisPeriodMonths = Math.min(periodMonths, remainingMonths);

      const periodStart = new Date(currentDate);
      const periodEnd   = new Date(currentDate);
      periodEnd.setMonth(periodEnd.getMonth() + thisPeriodMonths);

      const rentAmount    = monthlyRent * thisPeriodMonths;
      const depositAmount = isFirst ? monthlyRent * depositMonths : 0;
      const totalAmount   = rentAmount + depositAmount;
      const dueDate       = new Date(periodStart);

      payments.push({
        application:     applicationId,
        tenant:          tenant._id,
        landlord:        landlord._id,
        property:        property._id,
        paymentNumber,
        periodStart,
        periodEnd,
        dueDate,
        rentAmount,
        depositAmount,
        totalAmount,
        includesDeposit: isFirst && depositMonths > 0,
        periodMonths:    thisPeriodMonths,
        // ← ӨӨРЧЛӨЛТ: Эхний төлбөр "urgent", бусад "pending"
        status: isFirst ? "urgent" : "pending",
      });

      currentDate = new Date(periodEnd);
      remainingMonths -= thisPeriodMonths;
      paymentNumber++;
    }

    await Payment.insertMany(payments);

    // ← ӨӨРЧЛӨЛТ: Гэрээний статус "payment_pending" болгоно
    await Application.findByIdAndUpdate(applicationId, {
      contractStatus: "payment_pending",
    });

    // Tenant-д мэдэгдэл — /payments рүү чиглүүлнэ
    await createNotification({
      user:    tenant._id,
      title:   "Эхний төлбөрөө төлнө үү 💳",
      message: `"${property.title}" байрны гэрээ баталгаажлаа. Эхний төлбөр: ${payments[0]?.totalAmount?.toLocaleString()}₮. Төлбөрөө төлснөөр гэрээ идэвхжинэ.`,
      type:    "general",
      link:    "/payments",
    });

    // Landlord-д мэдэгдэл
    await createNotification({
      user:    landlord._id,
      title:   "Гэрээ баталгаажлаа, төлбөр хүлээгдэж байна",
      message: `"${property.title}" байрны гэрээнд хоёр тал гарын үсэг зурлаа. Эхний төлбөр хүлээгдэж байна.`,
      type:    "general",
      link:    "/payments",
    });

    console.log(`✓ ${payments.length} төлбөр үүслээ (applicationId: ${applicationId})`);
  } catch (error) {
    console.error("generatePayments error:", error);
  }
};

// ======================================================
// GET /api/payments/my — Миний төлбөрүүд (tenant)
// ======================================================
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ tenant: userId })
      .populate("property", "title location monthlyRent images")
      .populate("application", "contractStatus")
      .sort({ paymentNumber: 1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ======================================================
// GET /api/payments/landlord — Landlord-ийн орлого
// ======================================================
exports.getLandlordPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ landlord: userId })
      .populate("property", "title location monthlyRent images")
      .populate("tenant", "firstName lastName phone")
      .sort({ paymentNumber: 1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ======================================================
// GET /api/payments/application/:id — Гэрээний төлбөрүүд
// ======================================================
exports.getApplicationPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ application: req.params.id })
      .populate("property", "title monthlyRent")
      .sort({ paymentNumber: 1 });

    if (payments.length > 0) {
      const p = payments[0];
      const isTenant   = p.tenant.toString() === userId.toString();
      const isLandlord = p.landlord.toString() === userId.toString();
      if (!isTenant && !isLandlord) {
        return res.status(403).json({ message: "Зөвшөөрөлгүй" });
      }
    }

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ======================================================
// PUT /api/payments/:id/pay — Төлбөр төлсөн тэмдэглэх
// ======================================================
exports.markAsPaid = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { paymentMethod = "demo" } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate("property", "title")
      .populate("tenant", "firstName _id")
      .populate("landlord", "firstName _id");

    if (!payment) return res.status(404).json({ message: "Төлбөр олдсонгүй" });

    if (payment.tenant._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Зөвхөн түрээслэгч төлбөр төлж болно" });
    }

    if (payment.status === "paid") {
      return res.status(400).json({ message: "Аль хэдийн төлсөн байна" });
    }

    payment.status        = "paid";
    payment.paidAt        = new Date();
    payment.paidAmount    = payment.totalAmount;
    payment.paymentMethod = paymentMethod;
    await payment.save();

    // ← ӨӨРЧЛӨЛТ: Эхний төлбөр төлсөн бол гэрээ "active" болно
    if (payment.paymentNumber === 1) {
      await Application.findByIdAndUpdate(payment.application, {
        contractStatus: "active",
      });

      await createNotification({
        user:    payment.tenant._id,
        title:   "Гэрээ идэвхжлээ! 🎉",
        message: `"${payment.property.title}" байрны эхний төлбөр төлөгдлөө. Таны түрээсийн гэрээ одоо идэвхтэй боллоо.`,
        type:    "general",
        link:    "/my-rentals",
      });

      await createNotification({
        user:    payment.landlord._id,
        title:   "Эхний төлбөр хийгдлээ ✓",
        message: `"${payment.property.title}" байрны эхний төлбөр (${payment.totalAmount.toLocaleString()}₮) хийгдлээ. Гэрээ идэвхтэй боллоо.`,
        type:    "general",
        link:    "/payments",
      });
    } else {
      // Дараагийн төлбөрүүд
      await createNotification({
        user:    payment.landlord._id,
        title:   "Төлбөр хийгдлээ ✓",
        message: `"${payment.property.title}" байрны ${payment.paymentNumber}-р төлбөр (${payment.totalAmount.toLocaleString()}₮) хийгдлээ.`,
        type:    "general",
        link:    "/payments",
      });
    }

    res.json({ message: "Төлбөр амжилттай тэмдэглэгдлээ", payment });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ======================================================
// Хугацаа хэтэрсэн төлбөрүүдийг overdue болгох
// ======================================================
exports.updateOverduePayments = async () => {
  try {
    const now = new Date();
    const result = await Payment.updateMany(
      { status: { $in: ["urgent", "pending"] }, dueDate: { $lt: now } },
      { status: "overdue" }
    );
    console.log(`✓ ${result.modifiedCount} төлбөр overdue болов`);
  } catch (error) {
    console.error("updateOverduePayments error:", error);
  }
};