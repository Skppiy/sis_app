import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../requestHelper";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setUsers(usersRes);
      setSchools(schoolsRes);
    } catch (e) {
      console.error("Failed to load admin data:", e);
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

  if (loading) return <div className="container"><div className="card loading">Loading admin panel...</div></div>;

  return (
    <div className="container">
      <div className="card">
        <h1 className="welcome-title">Admin Panel</h1>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Manage users, schools, and system settings.
        </p>
        
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
      </div>

      {showAddForm && (
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

      <div className="card">
        <h2 className="section-title">Current Users</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>School</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{user.first_name} {user.last_name}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: '#e2e8f0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{user.school_name || 'N/A'}</td>
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
    </div>
  );
}
