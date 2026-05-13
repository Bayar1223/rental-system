const Property = require("../models/Property");

exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate(
      "owner",
      "firstName lastName email phone role"
    );

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({
      message: "Орон сууцнуудыг авахад алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "owner",
      "firstName lastName email phone role"
    );

    if (!property) {
      return res.status(404).json({
        message: "Орон сууц олдсонгүй",
      });
    }

    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({
      message: "Орон сууцны дэлгэрэнгүй авахад алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const property = await Property.create({
      ...req.body,

      monthlyRent: Number(req.body.monthlyRent),
      depositAmount: Number(req.body.depositAmount || 0),
      minLeaseMonths: Number(req.body.minLeaseMonths || 6),
      rooms: Number(req.body.rooms),
      area: Number(req.body.area),
      balconyCount: Number(req.body.balconyCount || 0),
      builtYear: Number(req.body.builtYear || 0),
      windowCount: Number(req.body.windowCount || 0),
      floorNumber: Number(req.body.floorNumber || 0),
      totalFloors: Number(req.body.totalFloors || 0),

      hasGarage: req.body.hasGarage === "true" || req.body.hasGarage === true,
      isFurnished:
        req.body.isFurnished === "true" || req.body.isFurnished === true,
      hasOutdoorParking:
        req.body.hasOutdoorParking === "true" ||
        req.body.hasOutdoorParking === true,

      images: imageUrls,
      owner: req.user.id,
    });

    res.status(201).json({
      message: "Орон сууц амжилттай нэмэгдлээ",
      property,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Орон сууц нэмэхэд алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Орон сууц олдсонгүй",
      });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Та энэ байрыг засах эрхгүй",
      });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("owner", "firstName lastName email phone role");

    res.status(200).json({
      message: "Орон сууц амжилттай шинэчлэгдлээ",
      property: updatedProperty,
    });
  } catch (error) {
    res.status(500).json({
      message: "Орон сууц шинэчлэхэд алдаа гарлаа",
      error: error.message,
    });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Орон сууц олдсонгүй",
      });
    }

    if (property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Та энэ байрыг устгах эрхгүй",
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Орон сууц амжилттай устгагдлаа",
    });
  } catch (error) {
    res.status(500).json({
      message: "Орон сууц устгахад алдаа гарлаа",
      error: error.message,
    });
  }
};