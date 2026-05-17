const express = require("express");
const router  = express.Router();
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getProperties,
  deleteProperty,
  getApplications,
  getPayments,
} = require("../controllers/adminController");

router.get("/stats",               adminOnly, getStats);
router.get("/users",               adminOnly, getUsers);
router.put("/users/:id/role",      adminOnly, updateUserRole);
router.delete("/users/:id",        adminOnly, deleteUser);
router.get("/properties",          adminOnly, getProperties);
router.delete("/properties/:id",   adminOnly, deleteProperty);
router.get("/applications",        adminOnly, getApplications);
router.get("/payments",            adminOnly, getPayments);

module.exports = router;