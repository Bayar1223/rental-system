import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";          // ← НЭМСЭН
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
import Notifications from "./pages/Notifications";
import AdminPanel from "./pages/AdminPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />   {/* ← НЭМСЭН */}
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/landlord-applications" element={<LandlordApplications />} />
        <Route path="/my-properties" element={<MyProperties />} />
        <Route path="/contract/:id" element={<Contract />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-rentals" element={<MyRentals />} />
        <Route path="/payments" element={<Payment />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;