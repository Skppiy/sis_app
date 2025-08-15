// frontend/src/components/admin/AdminLayout.jsx
// Main admin container that orchestrates all admin functionality

import { useState, useEffect } from "react";
import { apiGet } from "../../requestHelper";
import { useAuth } from "../../AuthContext";
import OverviewTab from "./tabs/OverviewTab";
import AcademicsTab from "./tabs/AcademicsTab";
import FacilitiesTab from "./tabs/FacilitiesTab";
import UsersTab from "./tabs/UsersTab";
import StudentsTab from "./tabs/StudentsTab";
import ErrorBanner from "./shared/ErrorBanner";

export default function AdminLayout() {
  const { active_school } = useAuth();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  
  // Data state
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
      // Set empty arrays to prevent crashes
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

  const clearError = () => setError("");

  const tabs = [
    { id: 'overview', label: 'Overview', component: OverviewTab },
    { id: 'academics', label: 'Academics', component: AcademicsTab },
    { id: 'facilities', label: 'Facilities', component: FacilitiesTab },
    { id: 'users', label: 'Users', component: UsersTab },
    { id: 'students', label: 'Students', component: StudentsTab }
  ];

  if (loading) {
    return (
      <div className="container">
        <div className="card loading">Loading admin panel...</div>
      </div>
    );
  }

  const ActiveTabComponent = tabs.find(t => t.id === tab)?.component;

  return (
    <div className="container">
      <div className="card">
        <h1 className="welcome-title">Admin Panel</h1>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Manage users, schools, academic structure, and system settings.
        </p>
        
        <ErrorBanner error={error} onClear={clearError} />
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              style={{
                padding: '8px 16px',
                background: tab === tabItem.id ? '#667eea' : '#e2e8f0',
                color: tab === tabItem.id ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Tab */}
      {ActiveTabComponent && (
        <ActiveTabComponent 
          data={data}
          onDataChange={loadData}
          onError={setError}
          onClearError={clearError}
        />
      )}
    </div>
  );
}