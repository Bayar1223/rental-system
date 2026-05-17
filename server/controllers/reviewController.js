const Review      = require("../models/Review");
const Application = require("../models/Application");

// Зөвхөн тухайн байрыг түрээсэлж байгаа эсвэл байсан tenant review өгч болно
const ALLOWED_STATUSES = ["signed", "payment_pending", "active", "cancelled"];

// GET /api/reviews/property/:propertyId — байрны бүх review
exports.getPropertyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate("tenant", "firstName lastName avatar")
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// POST /api/reviews/property/:propertyId — review нэмэх
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId     = req.user._id || req.user.id;
    const propertyId = req.params.propertyId;

    // Tenant энэ байрыг түрээсэлж байгаа эсэх шалгах
    const hasRented = await Application.findOne({
      property:       propertyId,
      tenant:         userId,
      contractStatus: { $in: ALLOWED_STATUSES },
    });

    if (!hasRented) {
      return res.status(403).json({
        message: "Зөвхөн энэ байрыг түрээсэлж байгаа хэрэглэгч үнэлгээ өгч болно",
      });
    }

    // Аль хэдийн review өгсөн бол update хийнэ
    const existing = await Review.findOne({ property: propertyId, tenant: userId });
    if (existing) {
      existing.rating  = rating;
      existing.comment = comment || "";
      await existing.save();
      return res.json({ message: "Үнэлгээ шинэчлэгдлээ", review: existing });
    }

    const review = await Review.create({
      property: propertyId,
      tenant:   userId,
      rating,
      comment:  comment || "",
    });

    res.status(201).json({ message: "Үнэлгээ амжилттай нэмэгдлээ", review });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// DELETE /api/reviews/:id — review устгах (өөрийнхөө)
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Үнэлгээ олдсонгүй" });
    if (review.tenant.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Зөвхөн өөрийн үнэлгээг устгаж болно" });
    }
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Үнэлгээ устгагдлаа" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};