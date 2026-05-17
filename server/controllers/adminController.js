const User        = require("../models/User");
const Property    = require("../models/Property");
const Application = require("../models/Application");
const Payment     = require("../models/Payment");

// GET /api/admin/stats — системийн статистик
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers, totalTenants, totalLandlords,
      totalProperties, availableProperties, rentedProperties,
      totalApplications, activeRentals,
      totalPayments, paidPayments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "tenant" }),
      User.countDocuments({ role: "landlord" }),
      Property.countDocuments(),
      Property.countDocuments({ status: "available" }),
      Property.countDocuments({ status: "rented" }),
      Application.countDocuments(),
      Application.countDocuments({ contractStatus: "active" }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: "paid" }),
    ]);

    // Нийт орлого
    const revenueData = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.json({
      users: { total: totalUsers, tenants: totalTenants, landlords: totalLandlords },
      properties: { total: totalProperties, available: availableProperties, rented: rentedProperties },
      applications: { total: totalApplications, active: activeRentals },
      payments: { total: totalPayments, paid: paidPayments, totalRevenue },
    });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// GET /api/admin/users — бүх хэрэглэгчид
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName:  { $regex: search, $options: "i" } },
      { email:     { $regex: search, $options: "i" } },
      { phone:     { $regex: search, $options: "i" } },
    ];

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// PUT /api/admin/users/:id/role — хэрэглэгчийн role өөрчлөх
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["tenant", "landlord", "admin"].includes(role)) {
      return res.status(400).json({ message: "Буруу role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "Хэрэглэгч олдсонгүй" });
    res.json({ message: "Role шинэчлэгдлээ", user });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// DELETE /api/admin/users/:id — хэрэглэгч устгах
exports.deleteUser = async (req, res) => {
  try {
    // Өөрийгөө устгахгүй
    if (req.params.id === (req.user._id || req.user.id).toString()) {
      return res.status(400).json({ message: "Өөрийгөө устгах боломжгүй" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Хэрэглэгч устгагдлаа" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// GET /api/admin/properties — бүх байрнууд
exports.getProperties = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { title:               { $regex: search, $options: "i" } },
      { "location.city":     { $regex: search, $options: "i" } },
      { "location.district": { $regex: search, $options: "i" } },
    ];

    const properties = await Property.find(filter)
      .populate("owner", "firstName lastName email phone")
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// DELETE /api/admin/properties/:id — байр устгах
exports.deleteProperty = async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: "Байр устгагдлаа" });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// GET /api/admin/applications — бүх хүсэлтүүд
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("property", "title location monthlyRent")
      .populate("tenant",   "firstName lastName email")
      .populate("landlord", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// GET /api/admin/payments — бүх төлбөрүүд
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("property", "title monthlyRent")
      .populate("tenant",   "firstName lastName email")
      .populate("landlord", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};