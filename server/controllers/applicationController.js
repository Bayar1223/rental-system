// ═══════════════════════════════════════════════════════════════════
//  📁 server/controllers/applicationController.js
//  ✅ ЗАСВАРЛАСАН — Phase 4
//
//  ШИНЭ ЗАСВАРУУД:
//   1) createApplication: client `propertyId` эсвэл `property` аль алийг хүлээж авна
//   2) signContract: generatePayments-ийг try-catch-ээр боож, paymentController
//      байхгүй / алдаатай тохиолдолд гарын үсэг зурах процесс crash болохгүй
// ═══════════════════════════════════════════════════════════════════

const Application = require("../models/Application");
const Property    = require("../models/Property");


// ──────────────────────────────────────────────────────────────────
//  POST /api/applications
// ──────────────────────────────────────────────────────────────────
const createApplication = async (req, res) => {
  try {
    // ⭐ ЗАСВАР: client `propertyId` эсвэл `property` явуулна
    const propertyId  = req.body.property || req.body.propertyId;
    const { startDate, leaseMonths, message } = req.body;

    if (!propertyId || !startDate || !leaseMonths) {
      return res
        .status(400)
        .json({ message: "Шаардлагатай талбарууд дутуу байна (property, startDate, leaseMonths)" });
    }

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "Байр олдсонгүй" });

    if (property.owner?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Өөрийнхөө байрд өргөдөл гаргах боломжгүй" });
    }

    if (property.status !== "available") {
      return res.status(400).json({ message: "Байр одоогоор боломжгүй" });
    }

    const existing = await Application.findOne({
      tenant:   req.user._id,
      property: propertyId,
      status:   { $nin: ["cancelled", "rejected"] },
    });
    if (existing) {
      return res.status(400).json({ message: "Та энэ байрд аль хэдийн өргөдөл гаргасан" });
    }

    // ⭐ minLeaseMonths шалгах
    const months = Number(leaseMonths);
    if (property.minLeaseMonths && months < property.minLeaseMonths) {
      return res.status(400).json({
        message: `Хамгийн бага түрээслэх хугацаа ${property.minLeaseMonths} сар`,
      });
    }

    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + months);

    const totalRent = (property.monthlyRent || 0) * months;

    const application = await Application.create({
      property:    propertyId,
      tenant:      req.user._id,
      landlord:    property.owner,
      startDate:   start,
      leaseMonths: months,
      endDate,
      totalRent,
      message:     message || "",
      status:      "pending",
    });

    const populated = await Application.findById(application._id)
      .populate("property", "title location monthlyRent images")
      .populate("tenant",   "firstName lastName email phone avatar")
      .populate("landlord", "firstName lastName email phone avatar");

    return res.status(201).json(populated);
  } catch (err) {
    console.error("createApplication:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/my
// ──────────────────────────────────────────────────────────────────
const getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ tenant: req.user._id })
      .populate("property", "title location monthlyRent images status")
      .populate("landlord", "firstName lastName email phone avatar")
      .sort({ createdAt: -1 });
    return res.json(apps);
  } catch (err) {
    console.error("getMyApplications:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/landlord
// ──────────────────────────────────────────────────────────────────
const getLandlordApplications = async (req, res) => {
  try {
    const apps = await Application.find({ landlord: req.user._id })
      .populate("property", "title location monthlyRent images status")
      .populate("tenant",   "firstName lastName email phone avatar")
      .sort({ createdAt: -1 });
    return res.json(apps);
  } catch (err) {
    console.error("getLandlordApplications:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/active
// ──────────────────────────────────────────────────────────────────
const getActiveRentals = async (req, res) => {
  try {
    const rentals = await Application.find({
      tenant: req.user._id,
      status: "approved",
      contractStatus: { $in: ["signed", "payment_pending", "active"] },
    })
      .populate("property")
      .populate("landlord", "firstName lastName email phone avatar")
      .sort({ startDate: -1 });
    return res.json(rentals);
  } catch (err) {
    console.error("getActiveRentals:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  PUT /api/applications/:id/status
// ──────────────────────────────────────────────────────────────────
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Статус буруу байна" });
    }

    const application = await Application.findById(id).populate("property");
    if (!application) return res.status(404).json({ message: "Өргөдөл олдсонгүй" });

    const isLandlord = application.landlord.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === "admin";
    if (!isLandlord && !isAdmin) {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({ message: "Зөвхөн хүлээгдэж буй өргөдлийг өөрчилнө" });
    }

    application.status = status;

    if (status === "approved") {
      application.contractStatus = "pending_signatures";

      await Application.updateMany(
        {
          property: application.property._id,
          _id:      { $ne: application._id },
          status:   "pending",
        },
        { $set: { status: "rejected" } }
      );

      await Property.findByIdAndUpdate(application.property._id, { status: "rented" });
    }

    await application.save();

    const populated = await Application.findById(application._id)
      .populate("property")
      .populate("tenant",   "firstName lastName email phone avatar")
      .populate("landlord", "firstName lastName email phone avatar");

    return res.json(populated);
  } catch (err) {
    console.error("updateApplicationStatus:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  PUT /api/applications/:id/sign
// ──────────────────────────────────────────────────────────────────
const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantSignature, landlordSignature } = req.body;

    const application = await Application.findById(id);
    if (!application) return res.status(404).json({ message: "Өргөдөл олдсонгүй" });

    if (application.status !== "approved") {
      return res.status(400).json({ message: "Зөвхөн зөвшөөрөгдсөн өргөдөл-д гарын үсэг зурна" });
    }

    const userId = req.user._id.toString();
    const isTenant   = application.tenant.toString()   === userId;
    const isLandlord = application.landlord.toString() === userId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    if (isTenant && tenantSignature) {
      application.tenantSignature = tenantSignature;
      application.tenantSigned    = true;
      application.tenantSignedAt  = new Date();
    }

    if (isLandlord && landlordSignature) {
      application.landlordSignature = landlordSignature;
      application.landlordSigned    = true;
      application.landlordSignedAt  = new Date();
    }

    const bothSigned = application.tenantSigned && application.landlordSigned;
    if (bothSigned) {
      application.contractStatus = "payment_pending";
    }

    await application.save();

    // ⭐ ЗАСВАР #6: try-catch-ээр боож, paymentController байхгүй / алдаатай үед
    //              гарын үсэг зурах процессыг УНАГАХГҮЙ
    if (bothSigned) {
      try {
        const { generatePayments } = require("./paymentController");
        if (typeof generatePayments === "function") {
          await generatePayments(application._id);
        } else {
          console.warn("generatePayments тодорхойлогдоогүй — алгассан");
        }
      } catch (paymentErr) {
        console.error("generatePayments алдаа (алгассан):", paymentErr.message);
        // ⚠️ Хэрэв payment автомат үүсэхгүй бол админ гараар үүсгэх боломжтой
      }
    }

    const populated = await Application.findById(application._id)
      .populate("property")
      .populate("tenant",   "firstName lastName email phone avatar")
      .populate("landlord", "firstName lastName email phone avatar");

    return res.json(populated);
  } catch (err) {
    console.error("signContract:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  PUT /api/applications/:id/cancel
// ──────────────────────────────────────────────────────────────────
const requestCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await Application.findById(id).populate("property");
    if (!application) return res.status(404).json({ message: "Өргөдөл олдсонгүй" });

    const userId = req.user._id.toString();
    const isTenant   = application.tenant.toString()   === userId;
    const isLandlord = application.landlord.toString() === userId;
    const isAdmin    = req.user.role === "admin";

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    if (["cancelled", "completed"].includes(application.status)) {
      return res.status(400).json({ message: "Энэ өргөдөл аль хэдийн хаагдсан байна" });
    }

    application.status                   = "cancelled";
    application.contractStatus           = "cancelled";
    application.cancellationRequestedBy  = req.user._id;
    application.cancellationReason       = reason || "Шалтгаан заагаагүй";
    application.cancellationRequestedAt  = new Date();

    await application.save();

    if (application.property?.status === "rented") {
      await Property.findByIdAndUpdate(application.property._id, { status: "available" });
    }

    const populated = await Application.findById(application._id)
      .populate("property")
      .populate("tenant",   "firstName lastName email phone avatar")
      .populate("landlord", "firstName lastName email phone avatar");

    return res.json(populated);
  } catch (err) {
    console.error("requestCancellation:", err);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


// ──────────────────────────────────────────────────────────────────
//  GET /api/applications/:id
// ──────────────────────────────────────────────────────────────────
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate("property")
      .populate("tenant",   "firstName lastName email phone avatar")
      .populate("landlord", "firstName lastName email phone avatar");

    if (!application) return res.status(404).json({ message: "Өргөдөл олдсонгүй" });

    const userId   = req.user._id.toString();
    const isTenant   = application.tenant?._id?.toString()   === userId;
    const isLandlord = application.landlord?._id?.toString() === userId;
    const isAdmin    = req.user.role === "admin";

    if (!isTenant && !isLandlord && !isAdmin) {
      return res.status(403).json({ message: "Энэ өргөдлийг харах эрх байхгүй" });
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
//  GET /api/applications/me/property/:propertyId
// ──────────────────────────────────────────────────────────────────
const getMyApplicationForProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const application = await Application.findOne({
      tenant:   req.user._id,
      property: propertyId,
      status:   { $nin: ["cancelled", "rejected"] },
    })
      .populate("property", "title location monthlyRent images status")
      .sort({ createdAt: -1 });
    return res.json(application || null);
  } catch (err) {
    console.error("getMyApplicationForProperty:", err);
    if (err.name === "CastError") return res.json(null);
    return res.status(500).json({ message: "Алдаа гарлаа" });
  }
};


module.exports = {
  createApplication,
  getMyApplications,
  getLandlordApplications,
  updateApplicationStatus,
  getActiveRentals,
  signContract,
  requestCancellation,
  getApplicationById,
  getMyApplicationForProperty,
};