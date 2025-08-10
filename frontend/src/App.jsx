import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./Login.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { getToken } from "./requestHelper.js";
import Admin from "./pages/Admin.jsx";

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="header">
        <div className="container">
          <Header />
        </div>
      </div>
      <nav className="nav">
        <div className="container">
          <Link to="/">🏠 Home</Link>
          <Link to="/dashboard">📊 Dashboard</Link>
          <Link to="/login">🔐 Login</Link>
          <Link to="/admin">⚙️ Admin</Link>
        </div>
      </nav>
      <main style={{ minHeight: 'calc(100vh - 200px)', padding: '20px 0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected>
                <Admin />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <Footer />
        </div>
      </footer>
    </BrowserRouter>
  );
}
