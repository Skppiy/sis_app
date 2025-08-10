import { useEffect, useState } from "react";
import { apiGet } from "../requestHelper";
import { useAuth } from "../AuthContext";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    apiGet("/dashboard/admin_overview").then(setData).catch(e => setErr(e?.detail || e?.message || "Failed"));
  }, []);
  return (
    <div className="card">
      <h2 className="section-title">Admin Dashboard</h2>
      {err && <div className="card error">{err}</div>}
      {!data ? <div>Loading…</div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="card" style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Total Users</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.total_users}</div>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Total Schools</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.total_schools}</div>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Roles Summary</div>
            <ul>
              {data.roles_summary.map(r => (
                <li key={r.role}>{r.role}: {r.count}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="section-title">Recent Users</div>
            <ul>
              {data.recent_users.map(u => (
                <li key={u.id}>{u.name} — {u.email}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    apiGet("/dashboard/teacher_overview").then(setData).catch(e => setErr(e?.detail || e?.message || "Failed"));
  }, []);
  return (
    <div className="card">
      <h2 className="section-title">Teacher Dashboard</h2>
      {err && <div className="card error">{err}</div>}
      {!data ? <div>Loading…</div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card">
            <div className="section-title">My Schools</div>
            <ul>{data.schools.map(s => (<li key={s.id}>{s.name}</li>))}</ul>
          </div>
          <div className="card">
            <div className="section-title">My Students</div>
            {data.students && data.students.length > 0 ? (
              <ul>
                {data.students.map(st => (
                  <li key={st.id}>{st.name} {st.email ? `— ${st.email}` : ''}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#718096' }}>No students yet.</div>
            )}
          </div>
          <div className="card">
            <div className="section-title">Colleagues</div>
            <ul>{data.colleagues.map(c => (<li key={c.id}>{c.name} — {c.email}</li>))}</ul>
          </div>
          <div className="card">
            <div className="section-title">Admin Contacts</div>
            <ul>{data.admins.map(a => (<li key={a.id}>{a.name} — {a.email}</li>))}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    apiGet("/dashboard/parent_overview").then(setData).catch(e => setErr(e?.detail || e?.message || "Failed"));
  }, []);
  return (
    <div className="card">
      <h2 className="section-title">Parent Dashboard</h2>
      {err && <div className="card error">{err}</div>}
      {!data ? <div>Loading…</div> : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card">
            <div className="section-title">My Schools</div>
            <ul>{data.schools.map(s => (<li key={s.id}>{s.name}</li>))}</ul>
          </div>
          <div className="card">
            <div className="section-title">Admin Contacts</div>
            <ul>{data.admins.map(a => (<li key={a.id}>{a.name} — {a.email}</li>))}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, active_role } = useAuth();
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
          Welcome{user ? `, ${user.first_name || user.email}` : ""}! 👋
        </h1>
        <p style={{ color: '#718096', fontSize: '1.1rem' }}>
          Manage your schools and students from your personalized dashboard.
        </p>
      </div>

      {active_role && (
        (active_role.includes('admin') ? <AdminDashboard />
         : active_role.includes('teacher') ? <TeacherDashboard />
         : active_role.includes('parent') ? <ParentDashboard />
         : null)
      )}

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

