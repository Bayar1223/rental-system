const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    leaseMonths: {
      type: Number,
      required: true,
    },
    endDate: {
      type: Date,
    },
    totalRent: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    contractStatus: {
      type: String,
      enum: [
        "none",
        "pending_signatures",
        "signed",
        "payment_pending",  // ← НЭМСЭН: гарын үсэг зурсан, эхний төлбөр хүлээгдэж байна
        "active",           // ← НЭМСЭН: эхний төлбөр төлөгдсөн, гэрээ идэвхтэй
        "cancelled",
      ],
      default: "none",
    },
    tenantSigned:     { type: Boolean, default: false },
    landlordSigned:   { type: Boolean, default: false },
    tenantSignedAt:   { type: Date },
    landlordSignedAt: { type: Date },

    tenantSignature:   { type: String },
    landlordSignature: { type: String },

    cancellationRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason:      { type: String },
    cancellationRequestedAt: { type: Date },

    message: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);