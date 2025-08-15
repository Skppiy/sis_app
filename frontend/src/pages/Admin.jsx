// frontend/src/pages/Admin.jsx - Clean, complete version

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
  const [tab, setTab] = useState("overview");
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError("");
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
      setError(`Failed to load data: ${e.message}`);
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
      setError("");
      await apiPost("/academic-years", yearData);
      loadData();
      setShowAddForm(false);
      setFormData({});
    } catch (e) {
      console.error("Failed to create academic year:", e);
      setError(`Failed to create academic year: ${e.message}`);
    }
  };

  const activateAcademicYear = async (yearId) => {
    try {
      setError("");
      await apiPatch(`/academic-years/${yearId}/activate`, {});
      loadData();
    } catch (e) {
      console.error("Failed to activate academic year:", e);
      setError(`Failed to activate academic year: ${e.message}`);
    }
  };

  // Subject Management
  const createSubject = async (subjectData) => {
    try {
      setError("");
      await apiPost("/subjects", subjectData);
      loadData();
      setShowAddForm(false);
      setFormData({});
    } catch (e) {
      console.error("Failed to create subject:", e);
      setError(`Failed to create subject: ${e.message}`);
    }
  };

  // Room Management
  const createRoom = async (roomData) => {
    try {
      setError("");
      await apiPost("/rooms", { ...roomData, school_id: active_school });
      loadData();
      setShowAddForm(false);
      setFormData({});
    } catch (e) {
      console.error("Failed to create room:", e);
      setError(`Failed to create room: ${e.message}`);
    }
  };

  // Classroom Management
  const createClassroom = async (classroomData) => {
    try {
      setError("");
      const activeYear = academicYears.find(y => y.is_active);
      if (!activeYear) {
        setError("No active academic year found. Please create and activate an academic year first.");
        return;
      }
      await apiPost("/classrooms", { ...classroomData, academic_year_id: activeYear.id });
      loadData();
      setShowAddForm(false);
      setFormData({});
    } catch (e) {
      console.error("Failed to create classroom:", e);
      setError(`Failed to create classroom: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card loading">Loading admin panel...</div>
      </div>
    );
  }

  const activeYear = academicYears.find(y => y.is_active);

  return (
    <div className="container">
      <div className="card">
        <h1 className="welcome-title">Admin Panel</h1>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Manage users, schools, academic structure, and system settings.
        </p>
        
        {error && (
          <div style={{ 
            background: '#fed7d7', 
            color: '#c53030', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid #feb2b2'
          }}>
            {error}
          </div>
        )}
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {['overview', 'users', 'students', 'academics', 'facilities'].map(tabName => (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              style={{
                padding: '8px 16px',
                background: tab === tabName ? '#667eea' : '#e2e8f0',
                color: tab === tabName ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: 4,
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096' }}>Active Academic Year</div>
              <div style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                color: activeYear ? '#667eea' : '#e53e3e' 
              }}>
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
          {/* Academic Years Section */}
          <div className="card">
            <h2 className="section-title">Academic Years</h2>
            <button
              onClick={() => {
                setShowAddForm('academic_year');
                setFormData({ name: '', start_date: '', end_date: '', is_active: false });
              }}
              style={{ 
                background: '#667eea', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 4, 
                marginBottom: 16,
                cursor: 'pointer'
              }}
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
                          background: year.is_active ? '#c6f5d6' : '#e2e8f0',
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
                            style={{ 
                              background: '#48bb78', 
                              color: 'white', 
                              border: 'none', 
                              padding: '4px 8px', 
                              borderRadius: 4, 
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
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

          {/* Subjects Section */}
          <div className="card">
            <h2 className="section-title">Subjects</h2>
            <button
              onClick={() => {
                setShowAddForm('subject');
                setFormData({
                  name: '', 
                  code: '', 
                  subject_type: 'CORE', 
                  applies_to_elementary: true,
                  applies_to_middle: true, 
                  is_homeroom_default: false, 
                  requires_specialist: false,
                  allows_cross_grade: false
                });
              }}
              style={{ 
                background: '#667eea', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 4, 
                marginBottom: 16,
                cursor: 'pointer'
              }}
            >
              ➕ Add Subject
            </button>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {subjects.map(subject => (
                <div key={subject.id} className="card" style={{ margin: 0 }}>
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
                      {subject.is_homeroom_default && (
                        <span style={{ 
                          background: '#bee3f8', 
                          color: '#2c5282', 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: '0.75rem', 
                          marginRight: 4 
                        }}>
                          Homeroom
                        </span>
                      )}
                      {subject.requires_specialist && (
                        <span style={{ 
                          background: '#d6f5d6', 
                          color: '#22543d', 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: '0.75rem', 
                          marginRight: 4 
                        }}>
                          Specialist
                        </span>
                      )}
                      {subject.is_system_core && (
                        <span style={{ 
                          background: '#fbb6ce', 
                          color: '#702459', 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: '0.75rem' 
                        }}>
                          System Core
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classrooms Section */}
          <div className="card">
            <h2 className="section-title">Classrooms - {activeYear ? activeYear.name : 'No Active Year'}</h2>
            {activeYear ? (
              <button
                onClick={() => {
                  setShowAddForm('classroom');
                  setFormData({ 
                    name: '', 
                    grade_level: '', 
                    subject_id: '', 
                    classroom_type: 'CORE', 
                    max_students: 25 
                  });
                }}
                style={{ 
                  background: '#667eea', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 4, 
                  marginBottom: 16,
                  cursor: 'pointer'
                }}
              >
                ➕ Add Classroom
              </button>
            ) : (
              <div style={{ 
                background: '#fef5e7', 
                color: '#c05621', 
                padding: '12px', 
                borderRadius: 4, 
                marginBottom: 16 
              }}>
                Please create and activate an academic year before adding classrooms.
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
              {classrooms.map(classroom => (
                <div key={classroom.id} className="card" style={{ margin: 0 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{classroom.name}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    Grade: {classroom.grade_level} • Subject: {classroom.subject?.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                    Type: {classroom.classroom_type} • Max: {classroom.max_students || 'No limit'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
                    Enrolled: {classroom.enrollment_count || 0} students
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
                name: '',
                room_number: '',
                room_type: 'CLASSROOM',
                capacity: 30,
                has_projector: false,
                has_smartboard: false,
                is_bookable: false
              });
            }}
            style={{ 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: 4, 
              marginBottom: 16,
              cursor: 'pointer'
            }}
          >
            ➕ Add Room
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {rooms.map(room => (
              <div key={room.id} className="card" style={{ margin: 0 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{room.name}</h3>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    Room: {room.room_number} • Type: {room.room_type}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                    Capacity: {room.capacity}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {room.has_projector && (
                      <span style={{ 
                        background: '#bee3f8', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: '0.75rem', 
                        marginRight: 4 
                      }}>
                        Projector
                      </span>
                    )}
                    {room.has_smartboard && (
                      <span style={{ 
                        background: '#d6f5d6', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: '0.75rem', 
                        marginRight: 4 
                      }}>
                        Smartboard
                      </span>
                    )}
                    {room.is_bookable && (
                      <span style={{ 
                        background: '#fbb6ce', 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: '0.75rem' 
                      }}>
                        Bookable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="card">
          <h2 className="section-title">User Management</h2>
          <p>User management features coming soon...</p>
        </div>
      )}

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="card">
          <h2 className="section-title">Student Management</h2>
          <p>Student management features coming soon...</p>
        </div>
      )}

      {/* Academic Year Form Modal */}
      {showAddForm === 'academic_year' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <h2>Add Academic Year</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Year Name (YYYY-YYYY):</label>
                <input
                  type="text"
                  placeholder="2024-2025"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  {' '}Set as Active Year
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => createAcademicYear(formData)} 
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  style={{ 
                    background: '#718096', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Form Modal */}
      {showAddForm === 'subject' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <h2>Add Subject</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Subject Name:</label>
                <input
                  type="text"
                  placeholder="Mathematics"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Subject Code:</label>
                <input
                  type="text"
                  placeholder="MATH"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Subject Type:</label>
                <select
                  value={formData.subject_type || 'CORE'}
                  onChange={(e) => setFormData({...formData, subject_type: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                  <option value="CORE">Core</option>
                  <option value="ENRICHMENT">Enrichment</option>
                  <option value="SPECIAL">Special</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Applies To:</label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.applies_to_elementary || false}
                    onChange={(e) => setFormData({...formData, applies_to_elementary: e.target.checked})}
                  />
                  {' '}Elementary School
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={formData.applies_to_middle || false}
                    onChange={(e) => setFormData({...formData, applies_to_middle: e.target.checked})}
                  />
                  {' '}Middle School
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_homeroom_default || false}
                    onChange={(e) => setFormData({...formData, is_homeroom_default: e.target.checked})}
                  />
                  {' '}Homeroom Default Subject
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={formData.requires_specialist || false}
                    onChange={(e) => setFormData({...formData, requires_specialist: e.target.checked})}
                  />
                  {' '}Requires Specialist Teacher
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={formData.allows_cross_grade || false}
                    onChange={(e) => setFormData({...formData, allows_cross_grade: e.target.checked})}
                  />
                  {' '}Allows Cross-Grade Enrollment
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => createSubject(formData)} 
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Create Subject
                </button>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  style={{ 
                    background: '#718096', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Form Modal */}
      {showAddForm === 'room' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <h2>Add Room</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Room Name:</label>
                <input
                  type="text"
                  placeholder="Room 101"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Room Number:</label>
                <input
                  type="text"
                  placeholder="101"
                  value={formData.room_number || ''}
                  onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Room Type:</label>
                <select
                  value={formData.room_type || 'CLASSROOM'}
                  onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="LAB">Lab</option>
                  <option value="LIBRARY">Library</option>
                  <option value="GYM">Gymnasium</option>
                  <option value="AUDITORIUM">Auditorium</option>
                  <option value="OFFICE">Office</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label>Capacity:</label>
                <input
                  type="number"
                  placeholder="30"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.has_projector || false}
                    onChange={(e) => setFormData({...formData, has_projector: e.target.checked})}
                  />
                  {' '}Has Projector
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={formData.has_smartboard || false}
                    onChange={(e) => setFormData({...formData, has_smartboard: e.target.checked})}
                  />
                  {' '}Has Smartboard
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_bookable || false}
                    onChange={(e) => setFormData({...formData, is_bookable: e.target.checked})}
                  />
                  {' '}Is Bookable
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => createRoom(formData)} 
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Create Room
                </button>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  style={{ 
                    background: '#718096', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Form Modal */}
      {showAddForm === 'classroom' && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <h2>Add Classroom</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Classroom Name:</label>
                <input
                  type="text"
                  placeholder="Mrs. Smith's 3rd Grade"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Grade Level:</label>
                <select
                  value={formData.grade_level || ''}
                  onChange={(e) => setFormData({...formData, grade_level: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                  <option value="">Select Grade Level</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="MIXED">Mixed Grades</option>
                </select>
              </div>
              <div>
                <label>Subject:</label>
                <select
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Classroom Type:</label>
                <select
                  value={formData.classroom_type || 'CORE'}
                  onChange={(e) => setFormData({...formData, classroom_type: e.target.value})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                  <option value="CORE">Core</option>
                  <option value="ENRICHMENT">Enrichment</option>
                  <option value="SPECIAL">Special</option>
                  <option value="HOMEROOM">Homeroom</option>
                </select>
              </div>
              <div>
                <label>Maximum Students:</label>
                <input
                  type="number"
                  placeholder="25"
                  value={formData.max_students || ''}
                  onChange={(e) => setFormData({...formData, max_students: parseInt(e.target.value) || null})}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => createClassroom(formData)} 
                  style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Create Classroom
                </button>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  style={{ 
                    background: '#718096', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}