backend/AuthContext.jsx - Updated to include academic year context

import { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, getToken, logout as logoutHelper } from './requestHelper';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [schools, setSchools] = useState([]);
  const [active_role, setActiveRole] = useState(null);
  const [active_school, setActiveSchool] = useState(null);
  const [active_academic_year, setActiveAcademicYear] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      loadSession();
    } else {
      setLoading(false);
    }
  }, []);

  const loadSession = async () => {
    try {
      const [contextRes, academicYearRes] = await Promise.all([
        apiGet('/auth/context'),
        apiGet('/academic-years/active').catch(() => null) // Don't fail if no active year
      ]);
      
      setUser(contextRes.user);
      setRoles(contextRes.roles || []);
      setSchools(contextRes.schools || []);
      setActiveRole(contextRes.active_role);
      setActiveSchool(contextRes.active_school);
      setActiveAcademicYear(academicYearRes);
    } catch (error) {
      console.error('Session load failed:', error);
      logoutHelper();
    } finally {
      setLoading(false);
    }
  };

  const reloadSession = async () => {
    await loadSession();
  };

  const logout = () => {
    logoutHelper();
    setUser(null);
    setRoles([]);
    setSchools([]);
    setActiveRole(null);
    setActiveSchool(null);
    setActiveAcademicYear(null);
    window.location.href = '/';
  };

  const value = {
    user,
    roles,
    schools,
    active_role,
    active_school,
    active_academic_year,
    loading,
    logout,
    reloadSession
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}