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

// ⭐ ЗАСВАР: "images" → "photos" (frontend болон model-тэй нийцүүлэв)
router.post("/", protect, upload.array("photos", 5), createRequest);

router.get("/landlord", protect, getLandlordRequests);

// ⭐ ЗАСВАР: frontend "/me" дууддаг тул /me нэмэв. /tenant-г alias болгон үлдээв.
router.get("/me",      protect, getTenantRequests);
router.get("/tenant",  protect, getTenantRequests);

router.put("/:id/approve", protect, approveRequest);
router.put("/:id/reject",  protect, rejectRequest);

module.exports = router;