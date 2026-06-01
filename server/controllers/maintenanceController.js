const MaintenanceRequest = require("../models/MaintenanceRequest");
const Application        = require("../models/Application");
const Payment            = require("../models/Payment");
const { createNotification } = require("./notificationController");

// ───────────────────────────────────────────────────────────────────
//  Helper: тухайн гэрээний барьцааны нийт дүн + одоогийн нийт суутгал
//  depositTotal = paid deposit payment-ийн depositAmount, эс бол property.depositAmount
//  deductedTotal = татгалзаагүй (pending/approved) бүх суутгалын нийлбэр
// ───────────────────────────────────────────────────────────────────
async function getDepositInfo(applicationId, property) {
  const depositPayment = await Payment.findOne({
    application: applicationId,
    includesDeposit: true,
  });

  const depositTotal =
    (depositPayment?.depositAmount > 0
      ? depositPayment.depositAmount
      : property?.depositAmount) || 0;

  const agg = await MaintenanceRequest.aggregate([
    { $match: { application: applicationId, status: { $ne: "rejected" } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const deductedTotal = agg[0]?.total || 0;

  return {
    depositTotal,
    deductedTotal,
    remaining: Math.max(depositTotal - deductedTotal, 0),
  };
}

// POST /api/maintenance — Гэмтлийн суутгах хүсэлт үүсгэх (landlord)
exports.createRequest = async (req, res) => {
  try {
    // ⭐ ЗАСВАР: frontend `reason`, `photos` илгээдэг (title/description/images биш)
    const { applicationId, reason, amount } = req.body;
    const landlordId = req.user._id || req.user.id;
    const photoUrls  = req.files ? req.files.map((f) => f.path) : [];
    const amt        = Number(amount); // ⭐ FormData-аас string ирдэг тул хөрвүүлэв

    // Application шалгах — property-д depositAmount, monthlyRent нэмж populate хийв
    const application = await Application.findById(applicationId)
      .populate("property", "title depositAmount monthlyRent")
      .populate("tenant", "firstName _id");

    if (!application) {
      return res.status(404).json({ message: "Гэрээ олдсонгүй" });
    }
    if (application.landlord.toString() !== landlordId.toString()) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }
    if (!["signed", "payment_pending", "active"].includes(application.contractStatus)) {
      return res.status(400).json({ message: "Идэвхтэй гэрээ байхгүй байна" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Шалтгаан оруулна уу" });
    }
    if (!amt || amt <= 0) {
      return res.status(400).json({ message: "Суутгах дүн 0-ээс их байх ёстой" });
    }

    // ⭐ ШИНЭ: барьцааны үлдэгдэл тооцоолох
    const { depositTotal, deductedTotal } = await getDepositInfo(
      application._id,
      application.property
    );
    const available = Math.max(depositTotal - deductedTotal, 0);

    if (depositTotal > 0 && amt > available) {
      return res.status(400).json({
        message: `Суутгах дүн үлдэгдэл барьцаанаас (${available.toLocaleString()}₮) хэтэрсэн байна`,
      });
    }

    const remainingDeposit = Math.max(available - amt, 0);

    const created = await MaintenanceRequest.create({
      application: applicationId,
      property:    application.property._id,
      landlord:    landlordId,
      tenant:      application.tenant._id,
      reason:      reason.trim(),
      amount:      amt,
      photos:      photoUrls,
      remainingDeposit,
    });

    // ⭐ Frontend жагсаалтад шууд нэмэгддэг тул populate хийж буцаана
    const request = await MaintenanceRequest.findById(created._id)
      .populate("property", "title location images")
      .populate("tenant", "firstName lastName phone")
      .populate("landlord", "firstName lastName phone");

    // Tenant-д мэдэгдэл
    await createNotification({
      user:    application.tenant._id,
      title:   "Гэмтлийн суутгалын хүсэлт ирлээ ⚠️",
      message: `"${application.property.title}" байранд ${amt.toLocaleString()}₮ суутгах хүсэлт ирлээ. Шалтгаан: ${reason.trim()}`,
      type:    "general",
      link:    "/maintenance",
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// GET /api/maintenance/landlord — Landlord-ийн илгээсэн хүсэлтүүд
exports.getLandlordRequests = async (req, res) => {
  try {
    const landlordId = req.user._id || req.user.id;
    const requests   = await MaintenanceRequest.find({ landlord: landlordId })
      .populate("property", "title location images")
      .populate("tenant", "firstName lastName phone")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// GET /api/maintenance/me (болон /tenant) — Tenant-д ирсэн хүсэлтүүд
exports.getTenantRequests = async (req, res) => {
  try {
    const tenantId = req.user._id || req.user.id;
    const requests = await MaintenanceRequest.find({ tenant: tenantId })
      .populate("property", "title location images")
      .populate("landlord", "firstName lastName phone")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// PUT /api/maintenance/:id/approve — Landlord баталгаажуулах → барьцаанаас суутгах
exports.approveRequest = async (req, res) => {
  try {
    const landlordId = req.user._id || req.user.id;
    const request    = await MaintenanceRequest.findById(req.params.id)
      .populate("property", "title")
      .populate("tenant", "firstName _id");

    if (!request) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    if (request.landlord.toString() !== landlordId.toString()) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Аль хэдийн шийдвэрлэгдсэн байна" });
    }

    // Барьцаа мөнгөний төлбөр олох (1-р төлбөр — depositAmount агуулсан)
    const depositPayment = await Payment.findOne({
      application:     request.application,
      includesDeposit: true,
      status:          "paid",
    });

    request.status              = "approved";
    request.deductedFromDeposit = !!depositPayment;
    await request.save();

    // Tenant-д мэдэгдэл — ⭐ ЗАСВАР: request.title → request.reason
    await createNotification({
      user:    request.tenant._id,
      title:   "Гэмтлийн суутгал баталгаажлаа",
      message: `"${request.property.title}" байраас ${request.amount.toLocaleString()}₮ барьцаа мөнгөнөөс суутгагдлаа. Шалтгаан: ${request.reason}`,
      type:    "general",
      link:    "/maintenance",
    });

    res.json({
      message: "Суутгал баталгаажлаа",
      request,
      deductedFromDeposit: request.deductedFromDeposit,
    });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// PUT /api/maintenance/:id/reject — Татгалзах
exports.rejectRequest = async (req, res) => {
  try {
    const landlordId = req.user._id || req.user.id;
    const { reason } = req.body; // landlord-ийн татгалзах тайлбар (request.reason биш)
    const request    = await MaintenanceRequest.findById(req.params.id)
      .populate("tenant", "firstName _id")
      .populate("property", "title");

    if (!request) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    if (request.landlord.toString() !== landlordId.toString()) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }

    request.status         = "rejected";
    request.tenantResponse = reason || "";
    await request.save();

    await createNotification({
      user:    request.tenant._id,
      title:   "Гэмтлийн суутгалын хүсэлт татгалзагдлаа",
      message: `"${request.property.title}" байрны суутгалын хүсэлт татгалзагдлаа.`,
      type:    "general",
      link:    "/maintenance",
    });

    res.json({ message: "Хүсэлт татгалзагдлаа", request });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};