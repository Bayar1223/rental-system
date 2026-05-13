import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PropertyDetail from "./pages/PropertyDetail";
import MyApplications from "./pages/MyApplications";
import AddProperty from "./pages/AddProperty";
import LandlordApplications from "./pages/LandlordApplications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />
        <Route
  path="/properties/:id"
  element={<PropertyDetail />}
/>
      <Route
  path="/my-applications"
  element={<MyApplications />}
/>
<Route
  path="/add-property"
  element={<AddProperty />}
/>
<Route
  path="/landlord-applications"
  element={<LandlordApplications />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;