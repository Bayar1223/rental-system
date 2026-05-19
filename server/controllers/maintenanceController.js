const MaintenanceRequest = require("../models/MaintenanceRequest");
const Application        = require("../models/Application");
const Payment            = require("../models/Payment");
const { createNotification } = require("./notificationController");

// POST /api/maintenance — Гэмтлийн суутгах хүсэлт үүсгэх (landlord)
exports.createRequest = async (req, res) => {
  try {
    const { applicationId, title, description, amount } = req.body;
    const landlordId = req.user._id || req.user.id;
    const imageUrls  = req.files ? req.files.map((f) => f.path) : [];

    // Application шалгах
    const application = await Application.findById(applicationId)
      .populate("property", "title")
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
    if (amount <= 0) {
      return res.status(400).json({ message: "Суутгах дүн 0-ээс их байх ёстой" });
    }

    const request = await MaintenanceRequest.create({
      application: applicationId,
      property:    application.property._id,
      landlord:    landlordId,
      tenant:      application.tenant._id,
      title,
      description,
      amount,
      images:      imageUrls,
    });

    // Tenant-д мэдэгдэл явуулах
    await createNotification({
      user:    application.tenant._id,
      title:   "Гэмтлийн суутгалын хүсэлт ирлээ ⚠️",
      message: `"${application.property.title}" байранд ${amount.toLocaleString()}₮ суутгах хүсэлт ирлээ. Шалтгаан: ${title}`,
      type:    "general",
      link:    "/my-rentals",
    });

    res.status(201).json({ message: "Хүсэлт амжилттай илгээгдлээ", request });
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

// GET /api/maintenance/tenant — Tenant-д ирсэн хүсэлтүүд
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
      application:    request.application,
      includesDeposit: true,
      status:         "paid",
    });

    request.status              = "approved";
    request.deductedFromDeposit = !!depositPayment;
    await request.save();

    // Tenant-д мэдэгдэл
    await createNotification({
      user:    request.tenant._id,
      title:   "Гэмтлийн суутгал баталгаажлаа",
      message: `"${request.property.title}" байраас ${request.amount.toLocaleString()}₮ барьцаа мөнгөнөөс суутгагдлаа. Шалтгаан: ${request.title}`,
      type:    "general",
      link:    "/my-rentals",
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
    const { reason } = req.body;
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
      link:    "/my-rentals",
    });

    res.json({ message: "Хүсэлт татгалзагдлаа", request });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};