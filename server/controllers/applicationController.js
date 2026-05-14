const Application = require("../models/Application");
const Property = require("../models/Property");

exports.createApplication = async (req, res) => {
  try {
    const { propertyId, startDate, leaseMonths, message } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Орон сууц олдсонгүй" });
    }

    if (property.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Өөрийн байр дээр хүсэлт явуулах боломжгүй" });
    }

    // Давхар хүсэлт илгээхгүй байх
    const existing = await Application.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ message: "Та энэ байранд аль хэдийн хүсэлт илгээсэн байна" });
    }

    const totalRent = property.monthlyRent * leaseMonths;

    const application = await Application.create({
      property: propertyId,
      tenant: req.user._id,
      landlord: property.owner,
      startDate,
      leaseMonths,
      totalRent,
      message,
    });

    res.status(201).json({ message: "Хүсэлт амжилттай илгээгдлээ", application });
  } catch (error) {
    res.status(500).json({ message: "Хүсэлт илгээхэд алдаа гарлаа", error: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ tenant: req.user._id })
      .populate("property")
      .populate("landlord", "firstName lastName phone email");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Хүсэлтүүд авахад алдаа гарлаа" });
  }
};

exports.getLandlordApplications = async (req, res) => {
  try {
    const applications = await Application.find({ landlord: req.user._id })
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

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Хүсэлт олдсонгүй" });
    }

    if (application.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Зөвшөөрөлгүй" });
    }

    application.status = status;
    await application.save();

    res.json({ message: "Хүсэлтийн төлөв шинэчлэгдлээ", application });
  } catch (error) {
    res.status(500).json({ message: "Шинэчлэхэд алдаа гарлаа" });
  }
};