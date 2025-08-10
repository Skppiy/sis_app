import { useState } from "react";
import { login, getToken, logout } from "./requestHelper.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (getToken()) {
    return (
      <div style={{ padding: 24 }}>
        <p>You’re already logged in.</p>
        <button onClick={() => { logout(); nav("/"); }}>Log out</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 360 }}>
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit}>
        <label>Email<br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <br /><br />
        <label>Password<br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br /><br />
        <button disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
      {err && <p style={{ color: "tomato" }}>{err}</p>}
    </div>
  );
}
