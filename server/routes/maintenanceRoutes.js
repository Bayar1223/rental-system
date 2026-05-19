const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload  = require("../middleware/upload");
const {
  createRequest,
  getLandlordRequests,
  getTenantRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/maintenanceController");

router.post("/",                protect, upload.array("images", 5), createRequest);
router.get("/landlord",         protect, getLandlordRequests);
router.get("/tenant",           protect, getTenantRequests);
router.put("/:id/approve",      protect, approveRequest);
router.put("/:id/reject",       protect, rejectRequest);

module.exports = router;