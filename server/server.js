// ⭐ dotenv-ийг БУСАД require-ийн өмнө дуудна
// (Үүнгүй бол cronJobs.js → emailService.js нь GMAIL_USER/PASS-гүй
//  үүсэж "Missing credentials for PLAIN" алдаа гарна)
const dotenv = require("dotenv");
dotenv.config();

const express        = require("express");
const cors           = require("cors");
const rateLimit      = require("express-rate-limit");
const mongoSanitize  = require("express-mongo-sanitize");
const connectDB      = require("./config/db");
const { protect }    = require("./middleware/authMiddleware");
const { startSchedulers } = require("./schedulers/cronJobs");

const app = express();

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

// Vercel preview deployment-уудыг автомат зөвшөөрөх
const VERCEL_PATTERN = /^https:\/\/.*-bayar1223s-projects\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (VERCEL_PATTERN.test(origin)) return callback(null, true);
    callback(new Error("CORS: зөвшөөрөгдөөгүй"));
  },
  credentials: true,
}));

// RATE LIMITERS
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: "Хэт олон удаа оролдлоо. 15 минутын дараа дахин оролдоно уу." },
  standardHeaders: true, legacyHeaders: false,
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { message: "Хэт олон бүртгэл үүсгэлээ. 1 цагийн дараа дахин оролдоно уу." },
  standardHeaders: true, legacyHeaders: false,
});
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 3,
  message: { message: "OTP хэт олон удаа илгээлээ. 5 минутын дараа дахин оролдоно уу." },
  standardHeaders: true, legacyHeaders: false,
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { message: "Хэт олон хүсэлт. Түр хүлээнэ үү." },
  standardHeaders: true, legacyHeaders: false,
});

// MIDDLEWARE
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());
app.use("/api", generalLimiter);

// ROUTES
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Rental System API ажиллаж байна ✓", env: process.env.NODE_ENV });
});

app.use("/api/auth/login",      loginLimiter);
app.use("/api/auth/register",   registerLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/resend-otp", otpLimiter);
app.use("/api/password-reset",  otpLimiter);

app.use("/api/admin",          require("./routes/adminRoutes"));
app.use("/api/auth",           require("./routes/authRoutes"));
app.use("/api/password-reset", require("./routes/passwordResetRoutes"));
app.use("/api/properties",     require("./routes/propertyRoutes"));
app.use("/api/applications",   require("./routes/applicationRoutes"));
app.use("/api/notifications",  require("./routes/notificationRoutes"));
app.use("/api/users",          require("./routes/userRoutes"));
app.use("/api/payments",       require("./routes/paymentRoutes"));
app.use("/api/reviews",        require("./routes/reviewRoutes"));
app.use("/api/maintenance",    require("./routes/maintenanceRoutes"));
app.use("/api/favorites", require("./routes/favorites"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/analytics", require("./routes/analytics"));
app.get("/api/test", protect, (req, res) => {
  res.json({ message: "Token амжилттай шалгагдлаа", user: req.user });
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint олдсонгүй" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: process.env.NODE_ENV === "production" ? "Серверт алдаа гарлаа" : err.message,
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startSchedulers();
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});