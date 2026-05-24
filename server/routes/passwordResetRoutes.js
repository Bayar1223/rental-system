// ═══════════════════════════════════════════════════════════════════
//  📁 server/routes/passwordResetRoutes.js
//  ⭐ PHASE 2 — ШИНЭ ФАЙЛ
//  Client `/api/password-reset/*`-аар хандах эндпойнтуудтай таарна
// ═══════════════════════════════════════════════════════════════════

const express = require("express");
const router = express.Router();
const {
  requestReset,
  resetWithOtp,
} = require("../controllers/passwordResetController");

router.post("/request", requestReset);
router.post("/reset", resetWithOtp);

module.exports = router;