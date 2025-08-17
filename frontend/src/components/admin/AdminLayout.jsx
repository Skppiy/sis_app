// frontend/src/components/admin/AdminLayout.jsx
// Updated admin orchestrator with proper student tab integration

import { useState, useEffect } from "react";
import { apiGet } from "../../requestHelper";
import { useAuth } from "../../AuthContext";
import OverviewTab from "./tabs/OverviewTab";
import AcademicsTab from "./tabs/AcademicsTab";
import FacilitiesTab from "./tabs/FacilitiesTab";
import UsersTab from "./tabs/UsersTab";
import StudentsTab from "./tabs/StudentsTab";

export default function AdminLayout() {
  const { active_school } = useAuth();
  
  // Simple state management
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [data, setData] = useState({
    users: [],
    schools: [],
    academicYears: [],
    subjects: [],
    rooms: [],
    classrooms: []
  });

  useEffect(() => {
    loadData();
  }, []);

  // Simple data loading
  const loadData = async () => {
    try {
      setError("");
      setLoading(true);
      
      const responses = await Promise.allSettled([
        apiGet("/admin/users"),
        apiGet("/schools"), 
        apiGet("/academic-years"),
        apiGet("/subjects"),
        apiGet("/rooms" + (active_school ? `?school_id=${active_school}` : "")),
        apiGet("/classrooms" + (active_school ? `?school_id=${active_school}` : ""))
      ]);

      const [usersRes, schoolsRes, yearsRes, subjectsRes, roomsRes, classroomsRes] = responses.map((response, index) => {
        const names = ['Users', 'Schools', 'Academic Years', 'Subjects', 'Rooms', 'Classrooms'];
        if (response.status === 'fulfilled') {
          console.log(`✅ ${names[index]} loaded:`, response.value);
          return response.value;
        } else {
          console.error(`❌ ${names[index]} failed:`, response.reason);
          return [];
        }
      });

      setData({
        users: usersRes,
        schools: schoolsRes,
        academicYears: yearsRes,
        subjects: subjectsRes,
        rooms: roomsRes,
        classrooms: classroomsRes
      });
    } catch (e) {
      console.error("Failed to load admin data:", e);
      setError("Failed to load admin data. Please refresh the page.");
      setData({
        users: [],
        schools: [],
        academicYears: [],
        subjects: [],
        rooms: [],
        classrooms: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Simple error handling
  const clearError = () => setError("");

  if (loading) {
    return (
      <div className="container">
        <div className="card loading">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Simple Header */}
      <div className="card">
        <h1 className="welcome-title">Admin Panel</h1>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Manage users, schools, academic structure, and system settings.
        </p>
        
        {/* Simple Error Banner */}
        {error && (
          <div style={{ 
            background: '#fed7d7', 
            color: '#c53030', 
            padding: '12px 16px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid #feb2b2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: '#c53030',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: 4,
                borderRadius: 2
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Simple Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {['overview', 'academics', 'facilities', 'users', 'students'].map(tabName => (
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

      {/* Tab Routing with proper data flow */}
      {tab === 'overview' && <OverviewTab data={data} />}
      
      {tab === 'academics' && (
        <AcademicsTab 
          data={data} 
          onDataChange={loadData} 
          onError={setError} 
        />
      )}
      
      {tab === 'facilities' && (
        <FacilitiesTab 
          data={data} 
          onDataChange={loadData} 
          onError={setError} 
        />
      )}

      {tab === 'users' && (
        <UsersTab 
          data={data}
        />
      )}

      {tab === 'students' && (
        <StudentsTab 
          data={data}
        />
      )}
    </div>
  );
}