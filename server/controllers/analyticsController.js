const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Property = require("../models/Property");
const Application = require("../models/Application");
const User = require("../models/User");

// Монгол сарын нэрс (index 0 = 1-р сар)
const MN_MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];

// Сүүлийн n сарыг (одоо хүртэл) тэг утгатайгаар үүсгэх
function lastNMonths(n) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1; // 1..12
    arr.push({
      y,
      m,
      key: `${y}-${String(m).padStart(2, "0")}`,
      label: MN_MONTHS[m - 1],
      total: 0,
    });
  }
  return arr;
}

const hasKeys = (obj) => obj && Object.keys(obj).length > 0;

/**
 * Үндсэн тооцоолол.
 * @param propertyMatch  Property-д тавих $match ({owner: uid} эсвэл {})
 * @param partyMatch     Payment/Application-д тавих $match ({landlord: uid} эсвэл {})
 */
async function computeAnalytics({ propertyMatch, partyMatch }) {
  // ── 1) Орлогын чиг хандлага (сүүлийн 12 сар) ──
  const incomeAgg = await Payment.aggregate([
    { $match: { ...partyMatch, status: "paid" } },
    { $addFields: { _when: { $ifNull: ["$paidAt", "$createdAt"] } } },
    {
      $group: {
        _id: { y: { $year: "$_when" }, m: { $month: "$_when" } },
        total: { $sum: { $ifNull: ["$paidAmount", "$totalAmount"] } },
      },
    },
  ]);

  const incomeTrend = lastNMonths(12);
  let totalIncome = 0;
  for (const r of incomeAgg) {
    totalIncome += r.total || 0;
    const slot = incomeTrend.find((t) => t.y === r._id.y && t.m === r._id.m);
    if (slot) slot.total = r.total || 0;
  }

  // ── 2) Эзлэлт (occupancy) ──
  const occAgg = await Property.aggregate([
    ...(hasKeys(propertyMatch) ? [{ $match: propertyMatch }] : []),
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const occupancy = { available: 0, rented: 0, other: 0 };
  for (const r of occAgg) {
    if (r._id === "available") occupancy.available = r.count;
    else if (r._id === "rented") occupancy.rented = r.count;
    else occupancy.other += r.count;
  }
  const totalProperties = occupancy.available + occupancy.rented + occupancy.other;

  // ── 3) Өргөдлийн юүлүүр (funnel) ──
  const funAgg = await Application.aggregate([
    ...(hasKeys(partyMatch) ? [{ $match: partyMatch }] : []),
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const funnel = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  for (const r of funAgg) {
    if (funnel[r._id] !== undefined) funnel[r._id] = r.count;
  }

  // ── 4) Дүүргээр дундаж үнэ ──
  const distAgg = await Property.aggregate([
    ...(hasKeys(propertyMatch) ? [{ $match: propertyMatch }] : []),
    {
      $group: {
        _id: "$location.district",
        avgPrice: { $avg: "$monthlyRent" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, avgPrice: -1 } },
    { $limit: 8 },
  ]);
  const byDistrict = distAgg
    .filter((d) => d._id) // null / хоосон мөрийг хасах
    .map((d) => ({
      district: d._id,
      avgPrice: Math.round(d.avgPrice || 0),
      count: d.count,
    }));

  // ── 5) KPI-ууд ──
  const activeLeases = await Application.countDocuments({
    ...partyMatch,
    contractStatus: "active",
  });

  return {
    kpis: {
      totalIncome,
      totalProperties,
      activeLeases,
      pendingApplications: funnel.pending,
    },
    incomeTrend,
    occupancy,
    funnel,
    byDistrict,
  };
}

// GET /api/analytics/landlord  (эзэн өөрийн дата)
exports.getLandlordAnalytics = async (req, res) => {
  try {
    if (req.user.role === "tenant") {
      return res
        .status(403)
        .json({ message: "Зөвхөн түрээслүүлэгч/админ хандах боломжтой" });
    }
    const uid = new mongoose.Types.ObjectId(req.user._id);
    const data = await computeAnalytics({
      propertyMatch: { owner: uid },
      partyMatch: { landlord: uid },
    });
    res.json({ scope: "landlord", ...data });
  } catch (err) {
    console.error("getLandlordAnalytics error:", err);
    res.status(500).json({ message: "Аналитик татаж чадсангүй" });
  }
};

// GET /api/analytics/admin  (бүх системийн дата)
exports.getAdminAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Зөвхөн админ хандах боломжтой" });
    }
    const data = await computeAnalytics({ propertyMatch: {}, partyMatch: {} });
    data.kpis.totalUsers = await User.countDocuments();
    res.json({ scope: "admin", ...data });
  } catch (err) {
    console.error("getAdminAnalytics error:", err);
    res.status(500).json({ message: "Аналитик татаж чадсангүй" });
  }
};