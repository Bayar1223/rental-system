const Application = require("../models/Application");
const Property = require("../models/Property");
const { createNotification } = require("./notificationController");
const { generatePayments } = require("./paymentController");

// POST /api/applications — хүсэлт үүсгэх
exports.createApplication = async (req, res) => {
  try {
    const { propertyId, startDate, leaseMonths, message } = req.body;

    const property = await Property.findById(propertyId).populate("owner", "firstName");
    if (!property) return res.status(404).json({ message: "Орон сууц олдсонгүй" });

    const userId = req.user._id || req.user.id;
    if (property.owner._id.toString() === userId.toString()) {
      return res.status(400).json({ message: "Өөрийн байр дээр хүсэлт явуулах боломжгүй" });
    }

    const existing = await Application.findOne({
      property: propertyId,
      tenant: userId,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "Та энэ байранд аль хэдийн хүсэлт илгээсэн байна" });
    }

    const totalRent = property.monthlyRent * leaseMonths;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(leaseMonths));

    const application = await Application.create({
      property: propertyId,
      tenant: userId,
      landlord: property.owner._id,
      startDate,
      endDate: end,
      leaseMonths,
      totalRent,
      message,
    });

    await createNotification({
      user: property.owner._id,
      title: "Шинэ хүсэлт ирлээ",
      message: `"${property.title}" байранд шинэ түрээсийн хүсэлт ирлээ`,
      type: "application_received",
      link: "/landlord-applications",
    });

    res.status(201).json({ message: "Хүсэлт амжилттай илгээгдлээ", application });
  } catch (error) {
    res.status(500).json({ message: "Хүсэлт илгээхэд алдаа гарлаа", error: error.message });
  }
};

// GET /api/applications/my — tenant-ийн хүсэлтүүд
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const applications = await Application.find({ tenant: userId })
      .populate("property")
      .populate("landlord", "firstName lastName phone email")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
  }
};

// GET /api/applications/landlord — landlord-ийн хүсэлтүүд
exports.getLandlordApplications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const applications = await Application.find({ landlord: userId })
      .populate("property")
      .populate("tenant", "firstName lastName phone email")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
  }
};

// GET /api/applications/active — идэвхтэй түрээснүүд
exports.getActiveRentals = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    const filter = {
      status: "approved",
      endDate: { $gte: new Date() },
    };

    if (role === "tenant") filter.tenant = userId;
    else filter.landlord = userId;

    const applications = await Application.find(filter)
      .populate("property", "title location monthlyRent images")
      .populate("tenant", "firstName lastName phone email")
      .populate("landlord", "firstName lastName phone email")
      .sort({ startDate: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// PUT /api/applications/:id/status — approve/reject
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user._id || req.user.id;

    const application = await Application.findById(req.params.id)
      .populate("property", "title")
      .populate("tenant", "firstName _id");

    if (!application) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });

    if (application.landlord.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }

    application.status = status;
    if (status === "approved") {
      application.contractStatus = "pending_signatures";
    }
    await application.save();

    const isApproved = status === "approved";
    await createNotification({
      user: application.tenant._id,
      title: isApproved ? "Хүсэлт зөвшөөрөгдлөө! 🎉" : "Хүсэлт татгалзагдлаа",
      message: isApproved
        ? `"${application.property.title}" байрны хүсэлтийг зөвшөөрлөө. Гэрээгээ харна уу.`
        : `"${application.property.title}" байрны хүсэлтийг татгалзлаа.`,
      type: isApproved ? "application_approved" : "application_rejected",
      link: "/my-applications",
    });

    res.json({ message: "Хүсэлтийн төлөв шинэчлэгдлээ", application });
  } catch (error) {
    res.status(500).json({ message: "Шинэчлэхэд алдаа гарлаа", error: error.message });
  }
};

// PUT /api/applications/:id/sign — гэрээнд гарын үсэг зурах
exports.signContract = async (req, res) => {
  try {
    const { signatureUrl } = req.body;
    const userId = req.user._id || req.user.id;

    const application = await Application.findById(req.params.id)
      .populate("property", "title _id paymentConditionText monthlyRent")
      .populate("tenant", "firstName _id")
      .populate("landlord", "firstName _id");

    if (!application) {
      return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    }

    if (application.status !== "approved") {
      return res.status(400).json({ message: "Зөвхөн зөвшөөрөгдсөн хүсэлтэд гэрээ байгуулах боломжтой" });
    }

    if (application.contractStatus === "cancelled") {
      return res.status(400).json({ message: "Цуцлагдсан гэрээнд гарын үсэг зурах боломжгүй" });
    }

    const isTenant   = application.tenant._id.toString() === userId.toString();
    const isLandlord = application.landlord._id.toString() === userId.toString();

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }

    if (application.contractStatus === "none") {
      application.contractStatus = "pending_signatures";
    }

    if (isTenant && !application.tenantSigned) {
      application.tenantSigned   = true;
      application.tenantSignedAt = new Date();
      if (signatureUrl) application.tenantSignature = signatureUrl;
    }

    if (isLandlord && !application.landlordSigned) {
      application.landlordSigned   = true;
      application.landlordSignedAt = new Date();
      if (signatureUrl) application.landlordSignature = signatureUrl;
    }

    // ← ӨӨРЧЛӨЛТ: Хоёр тал зурсан бол "signed" → generatePayments → "payment_pending" болно
    if (application.tenantSigned && application.landlordSigned) {
      application.contractStatus = "signed";

      const propertyId = application.property._id || application.property;
      await Property.findByIdAndUpdate(propertyId, { status: "rented" });

      // generatePayments дотор contractStatus "payment_pending" болгоно
      await generatePayments(application._id);
    }

    await application.save();
    res.json({ message: "Гарын үсэг амжилттай зурагдлаа", application });
  } catch (error) {
    console.error("signContract error:", error);
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// PUT /api/applications/:id/cancel — гэрээ цуцлах
exports.requestCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id || req.user.id;

    const application = await Application.findById(req.params.id)
      .populate("property", "title _id")
      .populate("tenant", "firstName _id")
      .populate("landlord", "firstName _id");

    if (!application) return res.status(404).json({ message: "Хүсэлт олдсонгүй" });

    const isTenant   = application.tenant._id.toString() === userId.toString();
    const isLandlord = application.landlord._id.toString() === userId.toString();

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }

    application.status                  = "cancelled";
    application.contractStatus          = "cancelled";
    application.cancellationRequestedBy = userId;
    application.cancellationReason      = reason || "";
    application.cancellationRequestedAt = new Date();

    const propertyId = application.property._id || application.property;
    await Property.findByIdAndUpdate(propertyId, { status: "available" });

    await application.save();

    const notifyUser = isTenant ? application.landlord._id : application.tenant._id;
    await createNotification({
      user: notifyUser,
      title: "Гэрээ цуцлагдлаа",
      message: `"${application.property.title}" байрны гэрээг цуцлах хүсэлт илгээгдлээ. Шалтгаан: ${reason || "—"}`,
      type: "application_rejected",
      link: isTenant ? "/landlord-applications" : "/my-applications",
    });

    res.json({ message: "Гэрээ цуцлагдлаа", application });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};