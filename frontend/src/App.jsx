import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import StockDetail from "./pages/StockDetail.jsx";
import NewsDetail from "./pages/NewsDetail.jsx";
import Alerts from "./pages/Alerts.jsx";
import Learn from "./pages/Learn.jsx";
import Community from "./pages/Community.jsx";
import NavBar from "./components/NavBar.jsx";

function PrivateLayout({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateLayout>
            <Watchlist />
          </PrivateLayout>
        }
      />
      <Route
        path="/portofoliu"
        element={
          <PrivateLayout>
            <Portfolio />
          </PrivateLayout>
        }
      />
      <Route
        path="/stock/:simbol"
        element={
          <PrivateLayout>
            <StockDetail />
          </PrivateLayout>
        }
      />
      <Route
        path="/stiri/:id"
        element={
          <PrivateLayout>
            <NewsDetail />
          </PrivateLayout>
        }
      />
      <Route
        path="/alerte"
        element={
          <PrivateLayout>
            <Alerts />
          </PrivateLayout>
        }
      />
      <Route
        path="/informare"
        element={
          <PrivateLayout>
            <Learn />
          </PrivateLayout>
        }
      />
      <Route
        path="/comunitate"
        element={
          <PrivateLayout>
            <Community />
          </PrivateLayout>
        }
      />
    </Routes>
  );
}
