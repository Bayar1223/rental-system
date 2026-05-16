const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
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
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    paymentNumber: { type: Number, required: true },
    periodStart:   { type: Date, required: true },
    periodEnd:     { type: Date, required: true },
    dueDate:       { type: Date, required: true },

    rentAmount:    { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    totalAmount:   { type: Number, required: true },

    includesDeposit: { type: Boolean, default: false },
    periodMonths:    { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "urgent",    // ← НЭМСЭН: эхний төлбөр, яаралтай
        "pending",
        "paid",
        "overdue",
        "cancelled",
      ],
      default: "pending",
    },

    paidAt:        { type: Date },
    paidAmount:    { type: Number },
    paymentMethod: { type: String, default: "" },

    qpayInvoiceId: { type: String, default: "" },
    qpayQrCode:    { type: String, default: "" },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);