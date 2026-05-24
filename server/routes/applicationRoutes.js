// ═══════════════════════════════════════════════════════════════════
//  📁 server/routes/applications.js
//  ⬇️ ЭНЭ ФАЙЛЫН АГУУЛГЫГ БҮХЭЛДЭЭ СОЛИНО
//     (Бүх хуучин агуулгыг устгаад, доорхыг шууд copy-paste хийнэ)
// ═══════════════════════════════════════════════════════════════════

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
  getApplicationById,           // ⭐ ШИНЭ
  getMyApplicationForProperty,  // ⭐ ШИНЭ
} = require("../controllers/applicationController");

const { protect } = require("../middleware/authMiddleware");


// ──────────────────── CREATE ────────────────────
router.post("/", protect, createApplication);


// ──────────────────── LIST ────────────────────
// /my, /landlord, /active нь /:id-р барьж аваагдахгүйн тулд УРД БАЙХ ёстой
router.get("/my", protect, getMyApplications);
router.get("/landlord", protect, getLandlordApplications);
router.get("/active", protect, getActiveRentals);


// ──────────────────── SINGLE (ШИНЭ) ────────────────────
// /me/property/:propertyId — /me/... pattern эхэлдэг тул /:id-р барьж аваагдахгүй
router.get(
  "/me/property/:propertyId",
  protect,
  getMyApplicationForProperty
);

// /:id — ЗААВАЛ бусад GET-уудын ДАРАА байх ёстой!
router.get("/:id", protect, getApplicationById);


// ──────────────────── STATUS / SIGN / CANCEL ────────────────────
router.put("/:id/status", protect, updateApplicationStatus);
router.put("/:id/sign", protect, signContract);
router.put("/:id/cancel", protect, requestCancellation);


module.exports = router;