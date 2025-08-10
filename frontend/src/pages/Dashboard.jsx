import { useEffect, useState } from "react";
import { apiGet } from "../requestHelper";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [meRes, schoolsRes] = await Promise.all([
          apiGet("/auth/me"),
          apiGet("/schools"),
        ]);
        if (!cancelled) {
          setMe(meRes);
          setSchools(schoolsRes);
        }
      } catch (e) {
        console.error("Dashboard error details:", e);
        if (!cancelled) setErr(e?.detail || e?.message || JSON.stringify(e) || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="container">
      <div className="card loading">
        <div>📚 Loading your dashboard...</div>
      </div>
    </div>
  );
  
  if (err) return (
    <div className="container">
      <div className="card error">
        ⚠️ {err}
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="card">
        <h1 className="welcome-title">
          Welcome{me?.user ? `, ${me.user.first_name || me.user.email}` : ""}! 👋
        </h1>
        <p style={{ color: '#718096', fontSize: '1.1rem' }}>
          Manage your schools and students from your personalized dashboard.
        </p>
      </div>

      <div className="card">
        <h2 className="section-title">Your Schools</h2>
        {schools.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏫</div>
            <p>No schools yet. Contact your administrator to get started!</p>
          </div>
        ) : (
          <ul className="school-list">
            {schools.map(s => (
              <li key={s.id} className="school-item">
                <div className="school-name">{s.name}</div>
                <div className="school-address">
                  📍 {s.address}
                  {(s.city || s.state || s.zip_code) && (
                    <span> • {s.city}{s.city && s.state && ', '}{s.state} {s.zip_code}</span>
                  )}
                  {s.tz && <span> • 🕐 {s.tz}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

