const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyPayments,
  getLandlordPayments,
  getApplicationPayments,
  markAsPaid,
} = require("../controllers/paymentController");

router.get("/my",              protect, getMyPayments);
router.get("/landlord",        protect, getLandlordPayments);
router.get("/application/:id", protect, getApplicationPayments);
router.put("/:id/pay",         protect, markAsPaid);

module.exports = router;