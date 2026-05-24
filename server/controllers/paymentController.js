const Payment = require("../models/Payment");
const Application = require("../models/Application");
const { createNotification } = require("./notificationController");

// ======================================================
// Төлбөрийн нөхцөлийг задлах
// ======================================================
function parsePaymentCondition(conditionText) {
  if (!conditionText || conditionText === "Барьцаа байхгүй") {
    return { months: 1, deposit: 0 };
  }
  const match = conditionText.match(/^(\d+)\+(\d+)$/);
  if (match) {
    return { months: parseInt(match[1]), deposit: parseInt(match[2]) };
  }
  return { months: 1, deposit: 0 };
}

// ======================================================
// Гэрээ баталгаажсаны дараа төлбөрүүд автомат үүсгэх
// ======================================================
exports.generatePayments = async (applicationId) => {
  try {
    const application = await Application.findById(applicationId)
      .populate("property").populate("tenant").populate("landlord");
    if (!application) return;

    const existing = await Payment.countDocuments({ application: applicationId });
    if (existing > 0) return;

    const { property, tenant, landlord, startDate, leaseMonths } = application;
    const monthlyRent   = property.monthlyRent;
    const conditionText = property.paymentConditionText || "Барьцаа байхгүй";

    const { months: periodMonths, deposit: depositMonths } = parsePaymentCondition(conditionText);

    const payments = [];
    let currentDate     = new Date(startDate);
    let paymentNumber   = 1;
    let remainingMonths = leaseMonths;

    while (remainingMonths > 0) {
      const isFirst          = paymentNumber === 1;
      const thisPeriodMonths = Math.min(periodMonths, remainingMonths);
      const periodStart      = new Date(currentDate);
      const periodEnd        = new Date(currentDate);
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
        paymentNumber, periodStart, periodEnd, dueDate,
        rentAmount, depositAmount, totalAmount,
        includesDeposit: isFirst && depositMonths > 0,
        periodMonths:    thisPeriodMonths,
        status:          isFirst ? "urgent" : "pending",
      });

      currentDate     = new Date(periodEnd);
      remainingMonths -= thisPeriodMonths;
      paymentNumber++;
    }

    await Payment.insertMany(payments);

    await Application.findByIdAndUpdate(applicationId, { contractStatus: "payment_pending" });

    await createNotification({
      user:    tenant._id,
      title:   "Эхний төлбөрөө төлнө үү 💳",
      message: `"${property.title}" байрны гэрээ баталгаажлаа. Эхний төлбөр: ${payments[0]?.totalAmount?.toLocaleString()}₮. Төлбөрөө төлснөөр гэрээ идэвхжинэ.`,
      type:    "general",
      link:    `/payments/${applicationId}`,
    });

    await createNotification({
      user:    landlord._id,
      title:   "Гэрээ баталгаажлаа, төлбөр хүлээгдэж байна",
      message: `"${property.title}" байрны гэрээнд хоёр тал гарын үсэг зурлаа. Эхний төлбөр хүлээгдэж байна.`,
      type:    "general",
      link:    `/payments/${applicationId}`,
    });

    console.log(`✓ ${payments.length} төлбөр үүслээ (applicationId: ${applicationId})`);
  } catch (error) {
    console.error("generatePayments error:", error);
  }
};

// ======================================================
// GET /api/payments/my
// ======================================================
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payments = await Payment.find({ tenant: userId })
      .populate("property", "title location monthlyRent images")
      .populate("application", "contractStatus")
      .populate("landlord", "firstName lastName email phone")
      .sort({ paymentNumber: 1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ======================================================
// GET /api/payments/landlord
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
// GET /api/payments/application/:id
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
// ⭐ ШИНЭ: POST /api/payments/:id/qpay/create
// QPay демо invoice үүсгэх
// ======================================================
exports.createQpayInvoice = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: "Төлбөр олдсонгүй" });
    if (payment.tenant.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Зөвхөн түрээслэгч төлбөр төлж болно" });
    }
    if (payment.status === "paid") {
      return res.status(400).json({ message: "Аль хэдийн төлсөн байна" });
    }

    // ⭐ Демо invoice ID + QR data үүсгэх
    const timestamp = Date.now();
    const random    = Math.random().toString(36).substring(2, 10).toUpperCase();
    const invoiceId = `QPAY-DEMO-${timestamp}-${random}`;
    const qrData    = `qpay://payment/${invoiceId}?amount=${payment.totalAmount}&currency=MNT`;

    // ⭐ Өгөгдлийн санд хадгалах
    payment.qpayInvoiceId = invoiceId;
    payment.qpayQrCode    = qrData;
    await payment.save();

    // QR зургийн URL — public QR generator ашиглана
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=240x240&color=0A0A0A&bgcolor=FFFFFF`;

    res.json({
      invoiceId,
      qrData,
      qrImageUrl,
      amount:    payment.totalAmount,
      expiresIn: 600, // 10 минут
    });
  } catch (error) {
    console.error("createQpayInvoice error:", error);
    res.status(500).json({ message: "QPay invoice үүсгэж чадсангүй", error: error.message });
  }
};

// ======================================================
// PUT /api/payments/:id/pay
// Төлбөр төлсөн тэмдэглэх
// ⭐ ШИНЭ: paymentMethod="qpay" үед qpayInvoiceId шалгана
// ======================================================
exports.markAsPaid = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { paymentMethod = "demo", qpayInvoiceId } = req.body;

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

    // ⭐ ШИНЭ: QPay invoice шалгах
    if (paymentMethod === "qpay") {
      if (!qpayInvoiceId) {
        return res.status(400).json({ message: "QPay invoice ID шаардлагатай" });
      }
      if (payment.qpayInvoiceId !== qpayInvoiceId) {
        return res.status(400).json({ message: "Invoice ID таарахгүй байна" });
      }
    }

    payment.status        = "paid";
    payment.paidAt        = new Date();
    payment.paidAmount    = payment.totalAmount;
    payment.paymentMethod = paymentMethod;
    await payment.save();

    // Эхний төлбөр төлсөн бол гэрээ active болгоно
    if (payment.paymentNumber === 1) {
      await Application.findByIdAndUpdate(payment.application, { contractStatus: "active" });

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
        link:    `/payments/${payment.application}`,
      });
    } else {
      await createNotification({
        user:    payment.landlord._id,
        title:   "Төлбөр хийгдлээ ✓",
        message: `"${payment.property.title}" байрны ${payment.paymentNumber}-р төлбөр (${payment.totalAmount.toLocaleString()}₮) хийгдлээ.`,
        type:    "general",
        link:    `/payments/${payment.application}`,
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