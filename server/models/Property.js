const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    location: {
      city: {
        type: String,
        required: true,
        default: "Улаанбаатар",
      },
      district: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },

    monthlyRent: {
      type: Number,
      required: true,
    },

    depositAmount: {
      type: Number,
      required: true,
    },

    paymentCondition: {
      type: String,
      enum: ["monthly", "quarterly", "half_year", "yearly"],
      default: "monthly",
    },

    minLeaseMonths: {
      type: Number,
      required: true,
      default: 6,
    },

    rooms: {
      type: Number,
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },

    propertyType: {
      type: String,
      enum: ["apartment", "house", "studio", "office"],
      default: "apartment",
    },

    hasOutdoorParking: {
      type: Boolean,
      default: false,
    },

    hasGarage: {
      type: Boolean,
      default: false,
    },

    isFurnished: {
      type: Boolean,
      default: false,
    },

    images: [
      {
        type: String,
      },
    ],

    virtualTourUrl: {
      type: String,
    },

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
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Property", propertySchema);