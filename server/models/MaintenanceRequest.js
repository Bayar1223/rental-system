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

    // ⭐ ЗАСВАР: frontend `reason` илгээдэг тул title/description → reason болгов.
    // (Хуучин required title/description нь validation алдаа өгч байсан.)
    reason: { type: String, required: true },

    amount: { type: Number, required: true }, // Суутгах дүн

    // ⭐ ЗАСВАР: multer + frontend `photos` гэдэг нэрээр илгээдэг тул images → photos.
    // Controller-т multer field-ийн нэрийг ЗААВАЛ `photos` болгоно уу:
    //   upload.array("photos")
    photos: [{ type: String }],

    // ⭐ ШИНЭ: суутгасны дараах үлдэгдэл барьцаа (snapshot).
    // Controller үүсгэх үед: remainingDeposit = (барьцааны нийт) − (өмнөх бүх суутгал + энэ дүн)
    remainingDeposit: { type: Number },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    deductedFromDeposit: { type: Boolean, default: true }, // Барьцаанаас суутгасан эсэх
    tenantResponse: { type: String, default: "" },          // Tenant-ийн хариу
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);