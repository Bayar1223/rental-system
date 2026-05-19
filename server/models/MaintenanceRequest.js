const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },       // Гэмтлийн нэр
    description: { type: String, required: true }, // Дэлгэрэнгүй тайлбар
    amount: { type: Number, required: true },       // Суутгах дүн
    images: [{ type: String }],                    // Гэмтлийн зурагнууд
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],   // Хүлээгдэж/Зөвшөөрсөн/Татгалзсан
      default: "pending",
    },
    deductedFromDeposit: { type: Boolean, default: false }, // Барьцаанаас суутгасан эсэх
    tenantResponse: { type: String, default: "" },          // Tenant-ийн хариу
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);