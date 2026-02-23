import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ─── Styles ───────────────────────────────────────────────────────── */
const S = {
  page: { maxWidth: 860, margin: '2rem auto', padding: '0 1rem' },
  h1: { fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text)' },
  sub: { fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow)' },
  sectionTitle: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  badge: (color) => ({ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: color + '22', color }),
  btn: { padding: '0.6rem 1.3rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  btnDanger: { padding: '0.5rem 1.1rem', background: '#fff', color: '#d93025', border: '1.5px solid #d93025', borderRadius: 8, fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  td: { padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text)' },
};

const STATUS_COLORS = { upcoming: '#1a73e8', completed: '#0f9d58', cancelled: '#d93025' };

function statusBadge(status) {
  const color = STATUS_COLORS[status] || 'var(--text-muted)';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span style={S.badge(color)}>{label}</span>;
}

/* ─── Component ────────────────────────────────────────────────────── */
export default function PatientAppointmentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = useCallback(() => {
    const all = JSON.parse(localStorage.getItem('appointments') || '[]');
    const userId = user?.id || user?._id;
    const mine = all.filter((a) => a.patient_id === userId);
    // Sort newest first
    mine.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setAppointments(mine);
  }, [user]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const cancelAppointment = (id) => {
    const all = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = all.map((a) => a.id === id ? { ...a, status: 'cancelled' } : a);
    localStorage.setItem('appointments', JSON.stringify(updated));
    loadAppointments();
  };

  // Find next upcoming appointment
  const upcoming = appointments.find((a) => a.status === 'upcoming');

  return (
    <div style={S.page}>
      <h1 style={S.h1}>📋 My Appointments</h1>
      <p style={S.sub}>Welcome, {user?.name || 'Patient'} — manage your appointments below.</p>

      {/* ── Upcoming Appointment Card ── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Your Next Appointment</div>
        {upcoming ? (
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🩺</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.15rem' }}>{upcoming.doctor_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{upcoming.speciality}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <span>📅 {upcoming.date} at {upcoming.time}</span><br />
                  <span>🏥 {upcoming.hospital}</span><br />
                  <span>💰 Fee: ₹{upcoming.fee}</span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {statusBadge(upcoming.status)}
                </div>
              </div>
              <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                <button style={S.btnDanger} onClick={() => {
                  if (window.confirm('Cancel this appointment?')) cancelAppointment(upcoming.id);
                }}>
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>No upcoming appointments</div>
            <button style={S.btn} onClick={() => navigate('/patient/book-appointment')}>
              🗓️ Book Appointment Now
            </button>
          </div>
        )}
      </div>

      {/* ── Book New Button ── */}
      {upcoming && (
        <div style={{ marginBottom: '1.25rem', textAlign: 'right' }}>
          <button style={S.btn} onClick={() => navigate('/patient/book-appointment')}>+ Book New Appointment</button>
        </div>
      )}

      {/* ── All Appointments Table ── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>All My Appointments</div>
        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No appointments found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Doctor</th>
                  <th style={S.th}>Reason</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td style={S.td}>{a.date}</td>
                    <td style={S.td}>{a.time}</td>
                    <td style={S.td}><div style={{ fontWeight: 600 }}>{a.doctor_name}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.speciality}</div></td>
                    <td style={S.td} title={a.reason}>{a.reason?.length > 30 ? a.reason.slice(0, 30) + '…' : a.reason}</td>
                    <td style={S.td}>{statusBadge(a.status)}</td>
                    <td style={S.td}>
                      {a.status === 'upcoming' && (
                        <button style={{ ...S.btnDanger, padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                          onClick={() => { if (window.confirm('Cancel this appointment?')) cancelAppointment(a.id); }}>
                          Cancel
                        </button>
                      )}
                      {a.status !== 'upcoming' && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
