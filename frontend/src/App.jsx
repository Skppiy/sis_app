import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./Login.jsx";
import Admin from "./pages/Admin.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

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
          <Link to="/admin">⚙️ Admin</Link>
          <Link to="/login">🔐 Login</Link>
        </div>
      </nav>
      <main style={{ minHeight: 'calc(100vh - 200px)', padding: '20px 0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <Admin />
              </ProtectedRoute>
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
