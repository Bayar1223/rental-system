const express = require("express");
const router = express.Router();

const {
  createApplication,
  getMyApplications,
  getLandlordApplications,
  updateApplicationStatus,
  getActiveRentals,
  signContract,
  requestCancellation,
} = require("../controllers/applicationController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createApplication);
router.get("/my", protect, getMyApplications);
router.get("/landlord", protect, getLandlordApplications);
router.get("/active", protect, getActiveRentals);         // Идэвхтэй түрээснүүд
router.put("/:id/status", protect, updateApplicationStatus);
router.put("/:id/sign", protect, signContract);           // Гэрээнд гарын үсэг
router.put("/:id/cancel", protect, requestCancellation);  // Гэрээ цуцлах

module.exports = router;