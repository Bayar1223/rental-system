const Application = require("../models/Application");
const Property = require("../models/Property");
const { createNotification } = require("./notificationController");

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
    const application = await Application.create({
      property: propertyId,
      tenant: userId,
      landlord: property.owner._id,
      startDate,
      leaseMonths,
      totalRent,
      message,
    });

    // Landlord-д мэдэгдэл илгээх
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

exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const applications = await Application.find({ tenant: userId })
      .populate("property")
      .populate("landlord", "firstName lastName phone email");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
  }
};

exports.getLandlordApplications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const applications = await Application.find({ landlord: userId })
      .populate("property")
      .populate("tenant", "firstName lastName phone email");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
  }
};

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
    await application.save();

    // Tenant-д мэдэгдэл илгээх
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