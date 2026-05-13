const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    location: {
      city: { type: String, required: true },
      district: { type: String, required: true },
      address: { type: String, required: true },
    },

    monthlyRent: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },

    paymentCondition: { type: String, default: "monthly" },
    paymentConditionText: { type: String, default: "" },
    minLeaseMonths: { type: Number, default: 6 },

    rooms: { type: Number, required: true },
    area: { type: Number, required: true },
    propertyType: { type: String, default: "apartment" },

    floorMaterial: { type: String, default: "" },
    doorType: { type: String, default: "" },
    balconyCount: { type: Number, default: 0 },
    builtYear: { type: Number },
    garageInfo: { type: String, default: "" },
    hasGarage: { type: Boolean, default: false },

    windowType: { type: String, default: "" },
    windowCount: { type: Number, default: 0 },
    floorNumber: { type: Number },
    totalFloors: { type: Number },

    isFurnished: { type: Boolean, default: false },
    hasOutdoorParking: { type: Boolean, default: false },

    contactName: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },

    details: { type: String, default: "" },
    images: [{ type: String }],

    status: {
      type: String,
      enum: ["available", "rented", "inactive"],
      default: "available",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);