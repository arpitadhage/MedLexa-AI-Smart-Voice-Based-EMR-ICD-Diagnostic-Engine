import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLOR = { doctor: '#1a73e8', patient: '#0f9d58' };
const ROLE_ICON  = { doctor: '🩺', patient: '🧑‍⚕️' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          Smart EMR
        </NavLink>

        {/* Nav Links — shown only when logged in */}
        {user && (
          <ul className="navbar-nav">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>

            {user.role === 'doctor' && (<>
              <li><NavLink to="/record-upload" className={({ isActive }) => isActive ? 'active' : ''}>Record</NavLink></li>
              <li><NavLink to="/transcript-result" className={({ isActive }) => isActive ? 'active' : ''}>Transcripts</NavLink></li>
              <li><NavLink to="/doctor-records" className={({ isActive }) => isActive ? 'active' : ''}>Records</NavLink></li>
              <li><NavLink to="/generate-emr" className={({ isActive }) => isActive ? 'active' : ''}>Generate EMR</NavLink></li>
              <li><NavLink to="/emr-form"     className={({ isActive }) => isActive ? 'active' : ''}>EMR Form</NavLink></li>
              <li><NavLink to="/progress-tracking" className={({ isActive }) => isActive ? 'active' : ''}>📊 Progress</NavLink></li>
              <li><NavLink to="/doctor/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>👨‍⚕️ Doctor Dashboard</NavLink></li>
            </>)}

            {user.role === 'patient' && (<>
              <li><NavLink to="/patient-dashboard" className={({ isActive }) => isActive ? 'active' : ''}>My Health</NavLink></li>
              <li><NavLink to="/patient/book-appointment" className={({ isActive }) => isActive ? 'active' : ''}>🗓️ Book Appointment</NavLink></li>
              <li><NavLink to="/patient/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>📋 My Appointments</NavLink></li>
            </>)}
          </ul>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropOpen((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 999, padding: '0.35rem 0.75rem 0.35rem 0.45rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: ROLE_COLOR[user.role] || 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>
                  {ROLE_ICON[user.role]}
                </span>
                <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {dropOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)', minWidth: 190, zIndex: 999, overflow: 'hidden' }}
                  onMouseLeave={() => setDropOpen(false)}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Signed in as</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all' }}>{user.email}</div>
                    <span style={{ marginTop: '0.3rem', display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: ROLE_COLOR[user.role] + '22', color: ROLE_COLOR[user.role] }}>
                      {ROLE_ICON[user.role]} {user.role.toUpperCase()}
                    </span>
                  </div>
                  {user.role === 'doctor' && user.department && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>🏥 {user.department}</div>
                  )}
                  {user.role === 'patient' && user.patientId && (
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>🆔 {user.patientId}</div>
                  )}
                  <button onClick={handleLogout} style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--danger)', fontWeight: 600 }}>
                    ↩ Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <NavLink to="/login"  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Sign In</NavLink>
              <NavLink to="/signup" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, background: 'var(--primary)', color: '#fff', borderRadius: 999, textDecoration: 'none' }}>Sign Up</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
