import { Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import StockDetail from "./pages/StockDetail.jsx";
import NewsDetail from "./pages/NewsDetail.jsx";
import Alerts from "./pages/Alerts.jsx";
import Learn from "./pages/Learn.jsx";
import Community from "./pages/Community.jsx";
import Methodology from "./pages/Methodology.jsx";
import Premium from "./pages/Premium.jsx";
import ThemePage from "./pages/ThemePage.jsx";
import NavBar from "./components/NavBar.jsx";
import BottomNav from "./components/BottomNav.jsx";

function PrivateLayout({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return (
    <>
      <NavBar />
      {children}
      <BottomNav />
    </>
  );
}

// Verificarea de token trebuie să stea ÎNTR-O componentă, nu inline în JSX-ul
// lui App — App nu se re-randează la navigare (React refolosește elementul),
// deci un ternar inline ar îngheța decizia logat/nelogat de la primul render
// și login-ul ar părea că nu funcționează (te-ar întoarce pe Landing).
function HomeRoute() {
  if (!getToken()) return <Landing />;
  return (
    <PrivateLayout>
      <Watchlist />
    </PrivateLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<HomeRoute />} />
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
        path="/tema/:slug"
        element={
          <PrivateLayout>
            <ThemePage />
          </PrivateLayout>
        }
      />
      <Route
        path="/premium"
        element={
          <PrivateLayout>
            <Premium />
          </PrivateLayout>
        }
      />
      <Route
        path="/metodologie"
        element={
          <PrivateLayout>
            <Methodology />
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
