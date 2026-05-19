const express = require("express");
const router  = express.Router();
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  toggleBlockUser,
  getProperties,
  deleteProperty,
  getApplications,
  getPayments,
} = require("../controllers/adminController");
const { runReportNow } = require("../schedulers/cronJobs");

router.get("/stats",               adminOnly, getStats);
router.get("/users",               adminOnly, getUsers);
router.put("/users/:id/role",      adminOnly, updateUserRole);
router.delete("/users/:id",        adminOnly, deleteUser);
router.put("/users/:id/block",     adminOnly, toggleBlockUser);
router.get("/properties",          adminOnly, getProperties);
router.delete("/properties/:id",   adminOnly, deleteProperty);
router.get("/applications",        adminOnly, getApplications);
router.get("/payments",            adminOnly, getPayments);

router.post("/run-report", adminOnly, async (req, res) => {
  await runReportNow();
  res.json({ message: "Тайлан илгээгдлээ" });
});

module.exports = router;