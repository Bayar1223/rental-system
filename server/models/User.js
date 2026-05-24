const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    // ⭐ ӨӨРЧЛӨЛТ: lastName-ыг required-аас гаргав (зарим нэр ганц үгтэй)
    lastName:  { type: String, default: "", trim: true },
    phone:     { type: String, required: true, unique: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    avatar:    { type: String, default: "" },
    password:  { type: String, required: true, minlength: 8 },
    role:      { type: String, enum: ["tenant", "landlord", "admin"], default: "tenant" },
    isBlocked: { type: Boolean, default: false },
    passwordResetToken:   { type: String },
    passwordResetExpires: { type: Date },
  },
  {
    timestamps: true,
    // ⭐ ӨӨРЧЛӨЛТ: virtual талбаруудыг JSON болон obj-д оруулна
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ⭐ ШИНЭ: `name` virtual — client `user.name`, `tenant.name` гэх мэт автоматаар ажиллана
userSchema.virtual("name").get(function () {
  const full = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  return full || this.firstName || "";
});

module.exports = mongoose.model("User", userSchema);