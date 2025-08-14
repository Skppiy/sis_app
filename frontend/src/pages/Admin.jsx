// frontend/src/pages/Admin.jsx - Updated with new Phase A features

import { useState, useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../requestHelper";
import { useAuth } from "../AuthContext";

export default function Admin() {
  const { active_school } = useAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); // overview | users | students | academics | facilities
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, schoolsRes, yearsRes, subjectsRes, roomsRes, classroomsRes] = await Promise.all([
        apiGet("/admin/users"),
        apiGet("/schools"),
        apiGet("/academic-years"),
        apiGet("/subjects"),
        apiGet("/rooms" + (active_school ? `?school_id=${active_school}` : "")),
        apiGet("/classrooms" + (active_school ? `?school_id=${active_school}` : ""))
      ]);
      setUsers(usersRes);
      setSchools(schoolsRes);
      setAcademicYears(yearsRes);
      setSubjects(subjectsRes);
      setRooms(roomsRes);
      setClassrooms(classroomsRes);
    } catch (e) {
      console.error("Failed to load admin data:", e);
      // Set empty arrays to prevent crashes
      setUsers([]);
      setSchools([]);
      setAcademicYears([]);
      setSubjects([]);
      setRooms([]);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Academic Year Management
  const createAcademicYear = async (yearData) => {
    try {
      await apiPost("/academic-years", yearData);
      loadData();
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create academic year:", e);
    }
  };

  const activateAcademicYear = async (yearId) => {
    try {
      await apiPatch(`/academic-years/${yearId}/activate`, {});
      loadData();
    } catch (e) {
      console.error("Failed to activate academic year:", e);
    }
  };

  // Subject Management
  const createSubject = async (subjectData) => {
    try {
      await apiPost("/subjects", subjectData);
      loadData();
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create subject:", e);
    }
  };

  // Room Management
  const createRoom = async (roomData) => {
    try {
      await apiPost("/rooms", { ...roomData, school_id: active_school });
      loadData();
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create room:", e);
    }
  };

  // Classroom Management
  const createClassroom = async (classroomData) => {
    try {
      const activeYear = academicYears.find(y => y.is_active);
      await apiPost("/classrooms", { ...classroomData, academic_year_id: activeYear.id });
      loadData();
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create classroom:", e);
    }
  };

  if (loading) return <div className="container"><div className="card loading">Loading admin panel...</div></div>;

  const activeYear = academicYears.find(y => y.is_active);

  return (
    <div className="container">
      <div className="card">
        <h1 className="welcome-title">Admin Panel</h1>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Manage users, schools, academic structure, and system settings.
        </p>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {['overview', 'users', 'students', 'academics', 'facilities'].map(tabName => (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              style={{
                padding: '8px 16px',
                background: tab === tabName ? '#667eea' : '#e2e8f0',
                color: tab === tabName ? 'white' : '#2d3748',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tabName}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="card">
          <h2 className="section-title">System Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Active Academic Year</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: activeYear ? '#667eea' : '#e53e3e' }}>
                {activeYear ? activeYear.name : 'No Active Year'}
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Total Schools</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{schools.length}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Total Users</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{users.length}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Subjects</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{subjects.length}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Classrooms</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{classrooms.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Academic Structure Tab */}
      {tab === 'academics' && (
        <>
          <div className="card">
            <h2 className="section-title">Academic Years</h2>
            <button
              onClick={() => {
                setShowAddForm('academic_year');
                setFormData({ name: '', start_date: '', end_date: '', is_active: false });
              }}
              style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginBottom: 16 }}
            >
              ➕ Add Academic Year
            </button>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: 12 }}>Year</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Period</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {academicYears.map(year => (
                    <tr key={year.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 12 }}>{year.name} ({year.short_name})</td>
                      <td style={{ padding: 12 }}>{year.start_date} → {year.end_date}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          background: year.is_active ? '#c6f6d5' : '#e2e8f0',
                          color: year.is_active ? '#22543d' : '#718096',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.875rem'
                        }}>
                          {year.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        {!year.is_active && (
                          <button
                            onClick={() => activateAcademicYear(year.id)}
                            style={{ background: '#48bb78', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: '0.875rem' }}
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Subjects</h2>
            <button
              onClick={() => {
                setShowAddForm('subject');
                setFormData({
                  name: '', code: '', subject_type: 'CORE', applies_to_elementary: true,
                  applies_to_middle: true, is_homeroom_default: false, requires_specialist: false
                });
              }}
              style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginBottom: 16 }}
            >
              ➕ Add Subject
            </button>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {subjects.map(subject => (
                <div key={subject.id} className="card" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0' }}>{subject.name}</h3>
                      <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                        Code: {subject.code} • Type: {subject.subject_type}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                        {subject.applies_to_elementary && 'Elementary'} 
                        {subject.applies_to_elementary && subject.applies_to_middle && ' • '}
                        {subject.applies_to_middle && 'Middle School'}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {subject.is_homeroom_default && <span style={{ background: '#bee3f8', color: '#2c5282', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', marginRight: 4 }}>Homeroom</span>}
                        {subject.requires_specialist && <span style={{ background: '#d6f5d6', color: '#22543d', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', marginRight: 4 }}>Specialist</span>}
                        {subject.is_system_core && <span style={{ background: '#fbb6ce', color: '#702459', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>System Core</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Classrooms - {activeYear ? activeYear.name : 'No Active Year'}</h2>
            {activeYear && (
              <button
                onClick={() => {
                  setShowAddForm('classroom');
                  setFormData({ name: '', grade_level: '', subject_id: '', classroom_type: 'CORE', max_students: 25 });
                }}
                style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginBottom: 16 }}
              >
                ➕ Add Classroom
              </button>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
              {classrooms.map(classroom => (
                <div key={classroom.id} className="card" style={{ margin: 0 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{classroom.name}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    Grade: {classroom.grade_level} • Subject: {classroom.subject?.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                    Type: {classroom.classroom_type} • Max: {classroom.max_students || 'No limit'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
                    Enrolled: {classroom.enrollment_count} students
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Facilities Tab */}
      {tab === 'facilities' && (
        <div className="card">
          <h2 className="section-title">Rooms & Facilities</h2>
          <button
            onClick={() => {
              setShowAddForm('room');
              setFormData({
                name: '', room_code: '', room_type: 'CLASSROOM', capacity: 25,
                has_projector: false, has_computers: false, has_smartboard: false, is_bookable: true
              });
            }}
            style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, marginBottom: 16 }}
          >
            ➕ Add Room
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {rooms.map(room => (
              <div key={room.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{room.name}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      Code: {room.room_code} • Type: {room.room_type}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                      Capacity: {room.capacity}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {room.has_projector && <span style={{ background: '#bee3f8', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', marginRight: 4 }}>Projector</span>}
                      {room.has_computers && <span style={{ background: '#c6f6d5', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', marginRight: 4 }}>Computers</span>}
                      {room.has_smartboard && <span style={{ background: '#d6f5d6', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', marginRight: 4 }}>Smartboard</span>}
                      {room.is_bookable && <span style={{ background: '#fbb6ce', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>Bookable</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Users and Students tabs remain the same */}
      {/* ... */}

      {/* Form Modals */}
      {showAddForm === 'academic_year' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <h2>Add Academic Year</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Year Name (YYYY-YYYY):</label>
                <input
                  type="text"
                  placeholder="2024-2025"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  {' '}Set as Active Year
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => createAcademicYear(formData)} style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4 }}>
                  Create
                </button>
                <button onClick={() => setShowAddForm(false)} style={{ background: '#718096', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar form modals for subjects, rooms, classrooms... */}
    </div>
  );
}