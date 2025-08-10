import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../requestHelper";
import { useAuth } from "../AuthContext";

export default function Admin() {
  const { active_school } = useAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users"); // users | students
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "teacher",
    school_id: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        apiGet("/admin/users"),
        apiGet("/schools")
      ]);
      console.log("Schools response:", schoolsRes); // Add this debug line
      setUsers(usersRes);
      setSchools(schoolsRes);
    } catch (e) {
      console.error("Failed to load admin data:", e);
      // Set empty arrays to prevent crashes
      setUsers([]);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/admin/users", formData);
      setShowAddForm(false);
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "teacher",
        school_id: ""
      });
      loadData(); // Refresh the list
    } catch (e) {
      console.error("Failed to create user:", e);
    }
  };

  // Students state
  const [students, setStudents] = useState([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    school_id: "",
    teacher_user_id: ""
  });

  useEffect(() => {
    if (active_school && !studentForm.school_id) {
      setStudentForm((s) => ({ ...s, school_id: active_school }));
    }
  }, [active_school]);

  async function loadStudents() {
    try {
      const data = await apiGet(active_school ? `/students?school_id=${active_school}` : '/students');
      setStudents(data);
    } catch (e) {
      console.error("Failed to load students", e);
      setStudents([]);
    }
  }

  const [teachers, setTeachers] = useState([]);
  async function loadTeachers() {
    try {
      const t = await apiGet(`/admin/teachers?school_id=${active_school || ""}`);
      setTeachers(t);
    } catch (e) {
      console.error("Failed to load teachers", e);
      setTeachers([]);
    }
  }

  useEffect(() => {
    if (tab === "students") { loadStudents(); loadTeachers(); }
  }, [tab, active_school]);

  async function submitStudent(e) {
    e.preventDefault();
    try {
      const payload = { first_name: studentForm.first_name, last_name: studentForm.last_name, school_id: studentForm.school_id };
      if (studentForm.email && studentForm.email.trim().length > 0) {
        payload.email = studentForm.email.trim();
      }
      if (studentForm.teacher_user_id) {
        await apiPost(`/students/create_and_assign?teacher_user_id=${studentForm.teacher_user_id}`, payload);
      } else {
        await apiPost("/students", payload);
      }
      setShowStudentForm(false);
      setStudentForm({ first_name: "", last_name: "", email: "", school_id: active_school || "", teacher_user_id: "" });
      loadStudents();
    } catch (e) {
      console.error("Failed to create student", e);
    }
  }

  if (loading) return <div className="container"><div className="card loading">Loading admin panel...</div></div>;

  return (
    <div className="container">
      <div className="card">
        <h1 className="welcome-title">Admin Panel</h1>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Manage users, schools, and system settings.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button onClick={() => setTab("users")} style={{ padding: '8px 16px', background: tab==='users' ? '#667eea' : '#e2e8f0', color: tab==='users' ? 'white' : '#2d3748', border: 'none', borderRadius: 6 }}>Staff</button>
          <button onClick={() => setTab("students")} style={{ padding: '8px 16px', background: tab==='students' ? '#667eea' : '#e2e8f0', color: tab==='students' ? 'white' : '#2d3748', border: 'none', borderRadius: 6 }}>Students</button>
        </div>

        {tab === 'users' && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ➕ Add New User
        </button>
        )}

        {tab === 'students' && (
        <button
          onClick={() => { setShowStudentForm(true); setStudentForm(s => ({ ...s, school_id: s.school_id || active_school || (schools[0]?.id || "") })); }}
          style={{
            background: '#667eea', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
          }}
        >
          ➕ Add Student
        </button>
        )}
      </div>

      {tab==='users' && showAddForm && (
        <div className="card">
          <h2 className="section-title">Add New User</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div>
                <label>Password:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>First Name:</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label>Last Name:</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              
              <div>
                <label>Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="teacher">Teacher</option>
                  <option value="specialist">Specialist</option>
                  <option value="admin_principal">Principal</option>
                  <option value="admin_vp">Vice Principal</option>
                  <option value="admin_dean">Dean</option>
                  <option value="admin_staff">Staff</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                </select>
              </div>
              
              <div>
                <label>School:</label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select a school</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Create User
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{
                  background: '#718096',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {tab==='users' && (
      <div className="card">
        <h2 className="section-title">Current Users</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Roles</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{user.first_name} {user.last_name}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span key={index} style={{
                          background: '#e2e8f0',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          marginRight: '4px',
                          display: 'inline-block',
                          marginBottom: '4px'
                        }}>
                          {role.role} @ {role.school_name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#718096', fontStyle: 'italic' }}>No roles assigned</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: user.is_active ? '#c6f6d5' : '#fed7d7',
                      color: user.is_active ? '#22543d' : '#c53030',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {tab==='students' && showStudentForm && (
        <div className="card">
          <h2 className="section-title">Add Student</h2>
          <form onSubmit={submitStudent}>
            <div style={{ display: 'grid', gap: 16, maxWidth: 500 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label>First Name:</label>
                  <input type="text" value={studentForm.first_name} onChange={(e)=>setStudentForm({...studentForm, first_name: e.target.value})} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                </div>
                <div>
                  <label>Last Name:</label>
                  <input type="text" value={studentForm.last_name} onChange={(e)=>setStudentForm({...studentForm, last_name: e.target.value})} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                </div>
              </div>
              <div>
                <label>Email (optional):</label>
                <input type="email" value={studentForm.email} onChange={(e)=>setStudentForm({...studentForm, email: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label>School:</label>
                <select value={studentForm.school_id || active_school || ''} onChange={(e)=>setStudentForm({...studentForm, school_id: e.target.value})} required style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}>
                  <option value="">Select a school</option>
                  {schools.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div>
                <label>Teacher (optional):</label>
                <select value={studentForm.teacher_user_id} onChange={(e)=>setStudentForm({...studentForm, teacher_user_id: e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}>
                  <option value="">Do not assign yet</option>
                  {teachers.map(t => (<option key={t.id} value={t.id}>{t.first_name} {t.last_name} — {t.email}</option>))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={{ background: '#667eea', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>Create Student</button>
                <button type="button" onClick={()=>setShowStudentForm(false)} style={{ background: '#718096', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {tab==='students' && (
        <div className="card">
          <h2 className="section-title">Current Students</h2>
          <div style={{ color: '#718096', marginBottom: 8 }}>
            Showing: {schools.find(s => String(s.id)===String(active_school))?.name || 'All schools'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: 12 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 12 }}>{st.first_name} {st.last_name}</td>
                    <td style={{ padding: 12 }}>{st.email || <span style={{ color: '#718096' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
