import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Doctor Profile ───────────────────────────────────────────────── */
const DOCTOR = {
  id: 'DOC-PRANAV-001',
  name: 'Dr. Pranav Raut',
  speciality: 'General Medicine',
  hospital: 'SmartEMR Clinic',
  experience: '10 years',
  fee: 500,
};

/* ─── Helpers ──────────────────────────────────────────────────────── */
function todayDDMMYYYY() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function parseDDMMYYYY(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`);
}

function isThisWeek(dateStr) {
  const d = parseDDMMYYYY(dateStr);
  if (!d) return false;
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const end = new Date(start); end.setDate(start.getDate() + 6);
  start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

function isFutureOrToday(dateStr) {
  const d = parseDDMMYYYY(dateStr);
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d >= today;
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const S = {
  page: { maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' },
  h1: { fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text)' },
  sub: { fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.9rem', marginBottom: '1.25rem' },
  statCard: (color) => ({ background: 'var(--surface)', border: '2px solid ' + color + '33', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center', boxShadow: 'var(--shadow)' }),
  sectionTitle: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  badge: (color) => ({ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: color + '22', color }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  td: { padding: '0.65rem 0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text)', verticalAlign: 'middle' },
  btnPrimary: { padding: '0.4rem 0.9rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' },
};

const STATUS_COLORS = { upcoming: '#1a73e8', completed: '#0f9d58', cancelled: '#d93025' };

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'var(--text-muted)';
  return <span style={S.badge(color)}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

/* ─── Component ────────────────────────────────────────────────────── */
export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [allApts, setAllApts] = useState([]);
  const today = todayDDMMYYYY();

  const load = useCallback(() => {
    const all = JSON.parse(localStorage.getItem('appointments') || '[]');
    const mine = all.filter((a) => a.doctor_id === DOCTOR.id);
    // Sort by date+time
    mine.sort((a, b) => {
      const da = parseDDMMYYYY(a.date);
      const db = parseDDMMYYYY(b.date);
      if (da - db !== 0) return da - db;
      return a.time.localeCompare(b.time);
    });
    setAllApts(mine);
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayApts = allApts.filter((a) => a.date === today && a.status === 'upcoming');
  const futureApts = allApts.filter((a) => isFutureOrToday(a.date) && a.status === 'upcoming' && a.date !== today);
  const completedApts = allApts.filter((a) => a.status === 'completed');
  const weekApts = allApts.filter((a) => isThisWeek(a.date));

  const startConsultation = (apt) => {
    localStorage.setItem('current_consultation_patient', JSON.stringify({
      name: apt.patient_name,
      phone: apt.patient_phone,
      reason: apt.reason,
    }));
    navigate('/record-upload');
  };

  const markCompleted = (id) => {
    const all = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = all.map((a) => a.id === id ? { ...a, status: 'completed' } : a);
    localStorage.setItem('appointments', JSON.stringify(updated));
    load();
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>👨‍⚕️ Doctor Dashboard</h1>
      <p style={S.sub}>Manage your appointments and consultations.</p>

      {/* ── Doctor Profile Card ── */}
      <div style={S.card}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>🩺</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.1rem' }}>{DOCTOR.name}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{DOCTOR.speciality} &nbsp;|&nbsp; {DOCTOR.hospital}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>⭐ {DOCTOR.experience} experience &nbsp;·&nbsp; ₹{DOCTOR.fee}/visit</div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={S.statsRow}>
        <div style={S.statCard('#1a73e8')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a73e8' }}>{allApts.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Total</div>
        </div>
        <div style={S.statCard('#f9ab00')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f9ab00' }}>{todayApts.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Today</div>
        </div>
        <div style={S.statCard('#a142f4')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a142f4' }}>{weekApts.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>This Week</div>
        </div>
        <div style={S.statCard('#0f9d58')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f9d58' }}>{completedApts.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Completed</div>
        </div>
      </div>

      {/* ── Today's Appointments ── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📅 Today's Appointments — {today}</div>
        {todayApts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No appointments scheduled for today.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Patient</th>
                  <th style={S.th}>Phone</th>
                  <th style={S.th}>Reason</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {todayApts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...S.td, fontWeight: 600, whiteSpace: 'nowrap' }}>{a.time}</td>
                    <td style={S.td}>{a.patient_name}</td>
                    <td style={S.td}>{a.patient_phone || '—'}</td>
                    <td style={S.td} title={a.reason}>{a.reason?.length > 28 ? a.reason.slice(0, 28) + '…' : a.reason}</td>
                    <td style={S.td}><StatusBadge status={a.status} /></td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button style={S.btnPrimary} onClick={() => startConsultation(a)}>
                          🎙 Start Consultation
                        </button>
                        <button style={{ ...S.btnPrimary, background: '#0f9d58' }} onClick={() => markCompleted(a.id)}>
                          ✓ Done
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Upcoming Appointments ── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>🗓️ Upcoming Appointments</div>
        {futureApts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No upcoming appointments.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Patient</th>
                  <th style={S.th}>Phone</th>
                  <th style={S.th}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {futureApts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>{a.date} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({a.day})</span></td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{a.time}</td>
                    <td style={S.td}>{a.patient_name}</td>
                    <td style={S.td}>{a.patient_phone || '—'}</td>
                    <td style={S.td} title={a.reason}>{a.reason?.length > 30 ? a.reason.slice(0, 30) + '…' : a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── All Appointments History ── */}
      {allApts.filter((a) => a.status !== 'upcoming').length > 0 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>📋 Past Appointments</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Patient</th>
                  <th style={S.th}>Reason</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allApts.filter((a) => a.status !== 'upcoming').map((a) => (
                  <tr key={a.id}>
                    <td style={S.td}>{a.date}</td>
                    <td style={S.td}>{a.time}</td>
                    <td style={S.td}>{a.patient_name}</td>
                    <td style={S.td} title={a.reason}>{a.reason?.length > 30 ? a.reason.slice(0, 30) + '…' : a.reason}</td>
                    <td style={S.td}><StatusBadge status={a.status} /></td>
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
