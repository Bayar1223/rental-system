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

    paymentNumber: { type: Number, required: true }, // 1-р, 2-р... төлөлт
    periodStart:   { type: Date, required: true },   // Ямар хугацааны эхлэл
    periodEnd:     { type: Date, required: true },   // Ямар хугацааны төгсгөл
    dueDate:       { type: Date, required: true },   // Төлөх огноо

    rentAmount:    { type: Number, required: true }, // Түрээсийн дүн
    depositAmount: { type: Number, default: 0 },     // Барьцааны дүн
    totalAmount:   { type: Number, required: true }, // Нийт төлөх дүн

    includesDeposit: { type: Boolean, default: false }, // Барьцаа орсон эсэх
    periodMonths:    { type: Number, required: true },  // Хэдэн сарын төлбөр

    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },

    paidAt:         { type: Date },
    paidAmount:     { type: Number },
    paymentMethod:  { type: String, default: "" }, // qpay, cash, transfer...

    // QPay (дараа real болгоход)
    qpayInvoiceId:  { type: String, default: "" },
    qpayQrCode:     { type: String, default: "" },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);