// ═══════════════════════════════════════════════════════════════════
//  📁 server/controllers/applicationController.js
//  ⬇️ БҮХЭЛДЭЭ СОЛИНО — copy-paste дарж бичих
// ═══════════════════════════════════════════════════════════════════

const Application = require("../models/Application");
const Property    = require("../models/Property");


// ──────────────────────────────────────────────────────────────────
//  POST /api/applications
//  Tenant байрд өргөдөл гаргах
// ──────────────────────────────────────────────────────────────────
const createApplication = async (req, res) => {
  try {
    const { property: propertyId, startDate, leaseMonths, message } = req.body;

    if (!propertyId || !startDate || !leaseMonths) {
      return res
        .status(400)
        .json({ message: "Шаардлагатай талбарууд дутуу байна" });
    }

    // Байр оршдог эсэх + landlord олох
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Байр олдсонгүй" });
    }

    // Tenant өөрийнхөө байрд өргөдөл гаргахгүй
    if (property.owner?.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Өөрийнхөө байрд өргөдөл гаргах боломжгүй" });
    }

    if (property.status !== "available") {
      return res.status(400).json({ message: "Байр одоогоор боломжгүй" });
    }

    // Аль хэдийн идэвхтэй өргөдөл байгаа эсэхийг шалгах
    const existing = await Application.findOne({
      tenant: req.user._id,
      property: propertyId,
      status: { $nin: ["cancelled", "rejected"] },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Та энэ байрд аль хэдийн өргөдөл гаргасан" });
    }

    // Эцсийн огноо + нийт түрээсийг тооцох
    const start = new Date(startDate);
    const months = Number(leaseMonths);
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + months);
    const totalRent = (property.price || 0) * months;

    const application = await Application.create({
      property:   propertyId,
      tenant:     req.user._id,
      landlord:   property.owner,
      startDate:  start,
      leaseMonths: months,
      endDate,
      totalRent,
      message:    message || "",
      status:     "pending",
    });

    const populated = await Application.findById(application._id)
      .populate("property", "title address district price photos")
      .populate("tenant",   "name email phone")
      .populate("landlord", "name email phone");

    return res.status(201).json(populated);
  } catch (err) {
    console.error("createApplication:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/my
//  Tenant өөрийн гаргасан БҮХ өргөдлүүдийг авах
// ──────────────────────────────────────────────────────────────────
const getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ tenant: req.user._id })
      .populate("property", "title address district price photos status")
      .populate("landlord", "name email phone")
      .sort({ createdAt: -1 });

    return res.json(apps);
  } catch (err) {
    console.error("getMyApplications:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/landlord
//  Landlord-ийн байруудад ирсэн БҮХ өргөдлүүд
// ──────────────────────────────────────────────────────────────────
const getLandlordApplications = async (req, res) => {
  try {
    const apps = await Application.find({ landlord: req.user._id })
      .populate("property", "title address district price photos status")
      .populate("tenant", "name email phone avatar")
      .sort({ createdAt: -1 });

    return res.json(apps);
  } catch (err) {
    console.error("getLandlordApplications:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/active
//  Tenant-ийн ИДЭВХТЭЙ түрээслэлүүд (active contract-тай)
// ──────────────────────────────────────────────────────────────────
const getActiveRentals = async (req, res) => {
  try {
    const rentals = await Application.find({
      tenant: req.user._id,
      status: "approved",
      contractStatus: { $in: ["signed", "payment_pending", "active"] },
    })
      .populate("property")
      .populate("landlord", "name email phone")
      .sort({ startDate: -1 });

    return res.json(rentals);
  } catch (err) {
    console.error("getActiveRentals:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  PUT /api/applications/:id/status
//  Landlord өргөдлийг ЗӨВШӨӨРӨХ / ТАТГАЛЗАХ
// ──────────────────────────────────────────────────────────────────
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Статус буруу байна" });
    }

    const application = await Application.findById(id).populate("property");
    if (!application) {
      return res.status(404).json({ message: "Өргөдөл олдсонгүй" });
    }

    // Зөвхөн landlord-той (эсвэл admin) болон зөвшөөрнө
    const isLandlord =
      application.landlord.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isLandlord && !isAdmin) {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Зөвхөн хүлээгдэж буй өргөдлийг өөрчилнө" });
    }

    application.status = status;

    if (status === "approved") {
      // Гарын үсэг зурах шатанд оруулна
      application.contractStatus = "pending_signatures";

      // Бусад өргөдлүүдийг автомат татгалзах
      await Application.updateMany(
        {
          property: application.property._id,
          _id: { $ne: application._id },
          status: "pending",
        },
        { $set: { status: "rejected" } }
      );

      // Байрны статусыг "түрээслэгдсэн" болгох
      await Property.findByIdAndUpdate(application.property._id, {
        status: "rented",
      });
    }

    await application.save();

    const populated = await Application.findById(application._id)
      .populate("property")
      .populate("tenant", "name email phone avatar")
      .populate("landlord", "name email phone");

    return res.json(populated);
  } catch (err) {
    console.error("updateApplicationStatus:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  PUT /api/applications/:id/sign
//  Хоёр тал гэрээнд гарын үсэг зурах
// ──────────────────────────────────────────────────────────────────
const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantSignature, landlordSignature } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Өргөдөл олдсонгүй" });
    }

    if (application.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Зөвхөн зөвшөөрөгдсөн өргөдөл-д гарын үсэг зурна" });
    }

    const userId = req.user._id.toString();
    const isTenant = application.tenant.toString() === userId;
    const isLandlord = application.landlord.toString() === userId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    // Tenant гарын үсэг
    if (isTenant && tenantSignature) {
      application.tenantSignature = tenantSignature;
      application.tenantSigned    = true;
      application.tenantSignedAt  = new Date();
    }

    // Landlord гарын үсэг
    if (isLandlord && landlordSignature) {
      application.landlordSignature = landlordSignature;
      application.landlordSigned    = true;
      application.landlordSignedAt  = new Date();
    }

    // Хоёулаа гарын үсэг зурвал → payment_pending руу шилжих
    if (application.tenantSigned && application.landlordSigned) {
      application.contractStatus = "payment_pending";
    }

    await application.save();

    const populated = await Application.findById(application._id)
      .populate("property")
      .populate("tenant", "name email phone avatar")
      .populate("landlord", "name email phone");

    return res.json(populated);
  } catch (err) {
    console.error("signContract:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  PUT /api/applications/:id/cancel
//  Өргөдөл / Гэрээ цуцлах хүсэлт
// ──────────────────────────────────────────────────────────────────
const requestCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await Application.findById(id).populate("property");
    if (!application) {
      return res.status(404).json({ message: "Өргөдөл олдсонгүй" });
    }

    const userId = req.user._id.toString();
    const isTenant = application.tenant.toString() === userId;
    const isLandlord = application.landlord.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    // Аль хэдийн дууссан / цуцлагдсан бол үгүй
    if (["cancelled", "completed"].includes(application.status)) {
      return res
        .status(400)
        .json({ message: "Энэ өргөдөл аль хэдийн хаагдсан байна" });
    }

    application.status                   = "cancelled";
    application.contractStatus           = "cancelled";
    application.cancellationRequestedBy  = req.user._id;
    application.cancellationReason       = reason || "Шалтгаан заагаагүй";
    application.cancellationRequestedAt  = new Date();

    await application.save();

    // Хэрэв гэрээ хийгдсэн байрны статусыг сэргээх
    if (application.property?.status === "rented") {
      await Property.findByIdAndUpdate(application.property._id, {
        status: "available",
      });
    }

    const populated = await Application.findById(application._id)
      .populate("property")
      .populate("tenant", "name email phone avatar")
      .populate("landlord", "name email phone");

    return res.json(populated);
  } catch (err) {
    console.error("requestCancellation:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  ⭐ GET /api/applications/:id
//  Single application авах — Contract, Payment, Detail хуудаснаас дуудна
// ──────────────────────────────────────────────────────────────────
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id)
      .populate("property")
      .populate("tenant",   "name email phone avatar firstName lastName")
      .populate("landlord", "name email phone avatar firstName lastName");

    if (!application) {
      return res.status(404).json({ message: "Өргөдөл олдсонгүй" });
    }

    // Зөвхөн оролцогч талуудад харагдана (tenant, landlord, admin)
    const userId = req.user._id.toString();
    const tenantId = application.tenant?._id?.toString();
    const landlordId = application.landlord?._id?.toString();
    const isTenant = tenantId === userId;
    const isLandlord = landlordId === userId;
    const isAdmin = req.user.role === "admin";

    if (!isTenant && !isLandlord && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Энэ өргөдлийг харах эрх байхгүй" });
    }

    return res.json(application);
  } catch (err) {
    console.error("getApplicationById:", err);
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Өргөдөл олдсонгүй" });
    }
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  ⭐ GET /api/applications/me/property/:propertyId
//  Tenant нь тухайн байрд аль хэдийн өргөдөл гаргасан эсэхийг шалгах
// ──────────────────────────────────────────────────────────────────
const getMyApplicationForProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const application = await Application.findOne({
      tenant:   req.user._id,
      property: propertyId,
      // cancelled / rejected бол дахин өргөдөл гаргаж болно
      status:   { $nin: ["cancelled", "rejected"] },
    })
      .populate("property", "title address district price photos status")
      .sort({ createdAt: -1 });

    // Олдоогүй ч 404 биш — null буцаах нь UX-д сайн
    return res.json(application || null);
  } catch (err) {
    console.error("getMyApplicationForProperty:", err);
    if (err.name === "CastError") {
      return res.json(null);
    }
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  EXPORTS
// ──────────────────────────────────────────────────────────────────
module.exports = {
  createApplication,
  getMyApplications,
  getLandlordApplications,
  updateApplicationStatus,
  getActiveRentals,
  signContract,
  requestCancellation,
  getApplicationById,           // ⭐ ШИНЭ
  getMyApplicationForProperty,  // ⭐ ШИНЭ
};