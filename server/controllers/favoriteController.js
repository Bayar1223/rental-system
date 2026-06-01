const Favorite = require("../models/Favorite");
const Property = require("../models/Property");

// ───────────────────────────────────────────────────────────────────
//  POST /api/favorites/:propertyId  — нэмэх/хасах (toggle)
//  буцаах: { favorited: true|false }
// ───────────────────────────────────────────────────────────────────
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { propertyId } = req.params;

    // Байр байгаа эсэхийг шалгах (хог өгөгдөл хадгалахгүйн тулд)
    const exists = await Property.exists({ _id: propertyId });
    if (!exists) return res.status(404).json({ message: "Байр олдсонгүй" });

    const existing = await Favorite.findOne({ user: userId, property: propertyId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ favorited: false });
    }

    await Favorite.create({ user: userId, property: propertyId });
    return res.status(201).json({ favorited: true });
  } catch (error) {
    // unique index давхцал — аль хэдийн хадгалсан гэж үзнэ
    if (error.code === 11000) return res.json({ favorited: true });
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Байр олдсонгүй" });
    }
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────
//  DELETE /api/favorites/:propertyId  — шууд хасах
// ───────────────────────────────────────────────────────────────────
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Favorite.findOneAndDelete({ user: userId, property: req.params.propertyId });
    res.json({ favorited: false });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────
//  GET /api/favorites/ids  — зөвхөн property id-уудын жагсаалт
//  (Home/жагсаалт дээр зүрхийг тэмдэглэхэд)
// ───────────────────────────────────────────────────────────────────
exports.getFavoriteIds = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const favs = await Favorite.find({ user: userId }).select("property -_id");
    res.json(favs.map((f) => f.property.toString()));
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────
//  GET /api/favorites  — хадгалсан байруудын бүрэн мэдээлэл
// ───────────────────────────────────────────────────────────────────
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const favs = await Favorite.find({ user: userId })
      .populate("property", "title location monthlyRent images status")
      .sort({ createdAt: -1 });

    // Устгагдсан байрыг хасаж, property объектуудыг буцаана
    const properties = favs
      .filter((f) => f.property) // populate null биш
      .map((f) => ({ ...f.property.toObject(), favoritedAt: f.createdAt }));

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};