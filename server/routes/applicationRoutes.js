const express = require("express");
const router = express.Router();

const {
  createApplication,
  getMyApplications,
  getLandlordApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createApplication);

router.get("/my", protect, getMyApplications);

router.get("/landlord", protect, getLandlordApplications);

router.put("/:id/status", protect, updateApplicationStatus);

module.exports = router;