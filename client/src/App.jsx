import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import PropertyDetail from "./pages/PropertyDetail";
import MyApplications from "./pages/MyApplications";
import AddProperty from "./pages/AddProperty";
import LandlordApplications from "./pages/LandlordApplications";
import MyProperties from "./pages/MyProperties";
import Contract from "./pages/Contract";
import EditProperty from "./pages/EditProperty";
import Profile from "./pages/Profile";
import MyRentals from "./pages/MyRentals";
import Payment from "./pages/Payment";
import MyPayments from "./pages/MyPayments"; // ⭐ ШИНЭ
import Notifications from "./pages/Notifications";
import AdminPanel from "./pages/AdminPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MaintenanceRequests from "./pages/MaintenanceRequests";

// ─────────────────────────────────────────────────────────────
//  Public paths — idle timeout болон Navbar-аас хасах
// ─────────────────────────────────────────────────────────────
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

// ─────────────────────────────────────────────────────────────
//  Idle timeout — зөвхөн logged-in page-д ажиллана
// ─────────────────────────────────────────────────────────────
function IdleGuard() {
  const location = useLocation();
  const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));
  useIdleTimeout(!isPublic);
  return null;
}

// ─────────────────────────────────────────────────────────────
//  Navbar global render — Landing + auth page-нд хасна
//  Бусад бүх page дээр Monte Carlo Navbar харагдана
// ─────────────────────────────────────────────────────────────
function NavbarWrapper() {
  const location = useLocation();

  // Root "/"-г бүрэн match хийх (Landing-ийн өөрийн nav байгаа)
  if (location.pathname === "/") return null;

  // Auth page-уудад navbar харуулахгүй
  const hideOnAuth = PUBLIC_PATHS.slice(1).some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );
  if (hideOnAuth) return null;

  return <Navbar />;
}

function App() {
  return (
    <BrowserRouter>
      <IdleGuard />
      <NavbarWrapper />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/landlord-applications" element={<LandlordApplications />} />
        <Route path="/my-properties" element={<MyProperties />} />
        <Route path="/contract/:id" element={<Contract />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-rentals" element={<MyRentals />} />
        {/* applicationId-г URL-аас уншина (Payment.jsx-н useParams) */}
        <Route path="/payments/:applicationId" element={<Payment />} />
        <Route path="/payments" element={<MyPayments />} /> {/* ⭐ ШИНЭ */}
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/maintenance" element={<MaintenanceRequests />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;