const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true }
);

// Нэг хэрэглэгч нэг байрыг ганц л удаа хадгална
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });
// Хэрэглэгчийн хадгалсныг шинээр нь эрэмбэлэх
favoriteSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Favorite", favoriteSchema);