import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, name, email, role, department, patientId }
  const [token, setToken]     = useState(() => localStorage.getItem('emr_token'));
  const [loading, setLoading] = useState(true);    // verifying token on mount

  // Set axios default header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('emr_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('emr_token');
    }
  }, [token]);

  // Verify token on app load
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get('/api/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await axios.post('/api/auth/register', payload);
    setToken(data.token);
    setUser(data.user);
    // If patient, sync caretaker info into emr_patients localStorage
    // so the doctor's "Send Medications to Caretaker" feature can find them
    if (data.user.role === 'patient') {
      try {
        const u = data.user;
        const patients = JSON.parse(localStorage.getItem('emr_patients') || '[]');
        const exists = patients.find(p => p.id === u.patientId || p.name?.toLowerCase() === u.name?.toLowerCase());
        if (!exists) {
          const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          patients.push({
            id: u.patientId || `PT-${Date.now()}`,
            name: u.name,
            email: u.email,
            age: '',
            gender: '',
            contact: '',
            caretaker_name:  u.caretaker_name  || '',
            caretaker_phone: u.caretaker_phone || '',
            caretaker_email: u.caretaker_email || '',
            diagnosis: '',
            total_visits: 0,
            first_visit: today,
            last_visit: today,
            created_at: new Date().toISOString(),
            visits: [],
          });
          localStorage.setItem('emr_patients', JSON.stringify(patients));
        }
      } catch (e) { /* silent */ }
    }
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
