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

    // Автоматаар тооцоологдоно: startDate + leaseMonths
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

    // Гэрээний төлөв
    contractStatus: {
      type: String,
      enum: ["none", "pending_signatures", "signed", "cancelled"],
      default: "none",
    },

    // Гэрээнд гарын үсэг зурсан эсэх
    tenantSigned: { type: Boolean, default: false },
    landlordSigned: { type: Boolean, default: false },
    tenantSignedAt: { type: Date },
    landlordSignedAt: { type: Date },

    // Гэрээ цуцлах хүсэлт
    cancellationRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: { type: String },
    cancellationRequestedAt: { type: Date },

    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Хадгалахын өмнө endDate автоматаар тооцоолох
applicationSchema.pre("save", function (next) {
  try {
    if (this.startDate && this.leaseMonths) {
      const end = new Date(this.startDate);
      end.setMonth(end.getMonth() + Number(this.leaseMonths));
      this.endDate = end;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Application", applicationSchema);