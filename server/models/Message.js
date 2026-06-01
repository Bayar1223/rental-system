const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Харилцааны "thread" нь application (гэрээ/өргөдөл) дээр суурилна
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Хүлээн авагчийг хадгалснаар unread count / мэдэгдэл хийхэд хялбар
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Thread дотор хугацааны дарааллаар хурдан татах
messageSchema.index({ application: 1, createdAt: 1 });
// Unread тооллого хурдан байх
messageSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Message", messageSchema);