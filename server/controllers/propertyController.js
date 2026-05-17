const Property = require("../models/Property");

const toNum = (val) => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
};

exports.getProperties = async (req, res) => {
  try {
    const {
      city, district, minRent, maxRent, rooms, search,
      page = 1, limit = 9,
    } = req.query;

    // ← ӨӨРЧЛӨЛТ: зөвхөн "available" байр харагдана
    const filter = { status: "available" };

    if (city) filter["location.city"] = city;
    if (district) filter["location.district"] = district;

    if (minRent || maxRent) {
      filter.monthlyRent = {};
      if (minRent) filter.monthlyRent.$gte = Number(minRent);
      if (maxRent) filter.monthlyRent.$lte = Number(maxRent);
    }

    if (rooms) filter.rooms = Number(rooms);

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
      ];
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("owner", "firstName lastName email phone role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      properties,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
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
      "owner", "firstName lastName email phone role"
    );
    if (!property) return res.status(404).json({ message: "Орон сууц олдсонгүй" });
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: "Орон сууцны дэлгэрэнгүй авахад алдаа гарлаа", error: error.message });
  }
};

exports.createProperty = async (req, res) => {
  try {
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    const property = await Property.create({
      ...req.body,
      location: {
        city:     req.body["location[city]"]     || req.body.location?.city     || "Улаанбаатар",
        district: req.body["location[district]"] || req.body.location?.district || "",
        address:  req.body["location[address]"]  || req.body.location?.address  || "",
      },
      description:       req.body.details || req.body.description || "",
      monthlyRent:       toNum(req.body.monthlyRent),
      depositAmount:     toNum(req.body.depositAmount)  ?? 0,
      minLeaseMonths:    toNum(req.body.minLeaseMonths) ?? 6,
      rooms:             toNum(req.body.rooms),
      area:              toNum(req.body.area),
      balconyCount:      toNum(req.body.balconyCount),
      builtYear:         toNum(req.body.builtYear),
      windowCount:       toNum(req.body.windowCount),
      floorNumber:       toNum(req.body.floorNumber),
      totalFloors:       toNum(req.body.totalFloors),
      hasGarage:         req.body.hasGarage        === "true",
      isFurnished:       req.body.isFurnished       === "true",
      hasOutdoorParking: req.body.hasOutdoorParking === "true",
      // ← НЭМСЭН: Газрын зургийн координат
      latitude:          toNum(req.body.latitude)  ?? null,
      longitude:         toNum(req.body.longitude) ?? null,
      images:            imageUrls,
      owner:             req.user._id || req.user.id,
    });

    res.status(201).json({ message: "Орон сууц амжилттай нэмэгдлээ", property });
  } catch (error) {
    res.status(500).json({ message: "Орон сууц нэмэхэд алдаа гарлаа", error: error.message });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Орон сууц олдсонгүй" });

    const userId = req.user._id || req.user.id;
    if (property.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Та энэ байрыг засах эрхгүй" });
    }

    const location = {
      city:     req.body["location[city]"]     || property.location?.city,
      district: req.body["location[district]"] || property.location?.district,
      address:  req.body["location[address]"]  || property.location?.address,
    };

    const existingImages = req.body.existingImages
      ? Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages]
      : [];
    const newImageUrls = req.files
      ? (req.files["images"] || []).map((f) => f.path)
      : [];
    const allImages = [...existingImages, ...newImageUrls];

    const numOrOld = (val, old) => toNum(val) ?? old;

    const updateData = {
      title:                req.body.title               || property.title,
      description:          req.body.details || req.body.description || property.description || "",
      details:              req.body.details             || property.details,
      location,
      monthlyRent:          numOrOld(req.body.monthlyRent,   property.monthlyRent),
      paymentConditionText: req.body.paymentConditionText || property.paymentConditionText,
      rooms:                numOrOld(req.body.rooms,         property.rooms),
      area:                 numOrOld(req.body.area,          property.area),
      balconyCount:         numOrOld(req.body.balconyCount,  property.balconyCount),
      builtYear:            numOrOld(req.body.builtYear,     property.builtYear),
      windowCount:          numOrOld(req.body.windowCount,   property.windowCount),
      floorNumber:          numOrOld(req.body.floorNumber,   property.floorNumber),
      totalFloors:          numOrOld(req.body.totalFloors,   property.totalFloors),
      floorMaterial:        req.body.floorMaterial  || property.floorMaterial,
      doorType:             req.body.doorType        || property.doorType,
      windowType:           req.body.windowType      || property.windowType,
      garageInfo:           req.body.garageInfo      || property.garageInfo,
      hasGarage:            req.body.hasGarage         === "true",
      isFurnished:          req.body.isFurnished        === "true",
      hasOutdoorParking:    req.body.hasOutdoorParking  === "true",
      contactName:          req.body.contactName   || property.contactName,
      contactPhone:         req.body.contactPhone  || property.contactPhone,
      contactEmail:         req.body.contactEmail  || property.contactEmail,
      // ← НЭМСЭН: Координат (илгээгдсэн бол шинэчлэх, эсвэл хуучнаар)
      latitude:             toNum(req.body.latitude)  ?? property.latitude  ?? null,
      longitude:            toNum(req.body.longitude) ?? property.longitude ?? null,
      images:               allImages.length > 0 ? allImages : property.images,
    };

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate("owner", "firstName lastName email phone role");

    res.status(200).json({ message: "Орон сууц амжилттай шинэчлэгдлээ", property: updatedProperty });
  } catch (error) {
    res.status(500).json({ message: "Орон сууц шинэчлэхэд алдаа гарлаа", error: error.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Орон сууц олдсонгүй" });

    const userId = req.user._id || req.user.id;
    if (property.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Та энэ байрыг устгах эрхгүй" });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Орон сууц амжилттай устгагдлаа" });
  } catch (error) {
    res.status(500).json({ message: "Орон сууц устгахад алдаа гарлаа", error: error.message });
  }
};