const Property = require("../models/Property");

// Орон сууцны зар нэмэх
exports.createProperty = async (req, res) => {
  try {
    const property = await Property.create({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json({
      message: "Орон сууцны зар амжилттай нэмэгдлээ",
      property,
    });
  } catch (error) {
    res.status(500).json({
      message: "Орон сууцны зар нэмэхэд алдаа гарлаа",
      error: error.message,
    });
  }
};

// Бүх орон сууцны зар авах
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("owner", "firstName lastName phone email role")
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    res.status(500).json({
      message: "Орон сууцны зарууд авахад алдаа гарлаа",
      error: error.message,
    });
  }
};

// Нэг орон сууцны дэлгэрэнгүй авах
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner",
      "firstName lastName phone email role"
    );

    if (!property) {
      return res.status(404).json({
        message: "Орон сууцны зар олдсонгүй",
      });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({
      message: "Орон сууцны дэлгэрэнгүй авахад алдаа гарлаа",
      error: error.message,
    });
  }
};

// Property UPDATE хийх\
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Олдсонгүй" });
    }

    // зөвхөн owner update хийнэ
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Зөвшөөрөлгүй",
      });
    }

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Update хийхэд алдаа гарлаа",
    });
  }
};

//Property DELETE хийх
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Олдсонгүй" });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Зөвшөөрөлгүй",
      });
    }

    await property.deleteOne();

    res.json({ message: "Амжилттай устгалаа" });
  } catch (error) {
    res.status(500).json({
      message: "Устгахад алдаа гарлаа",
    });
  }
};