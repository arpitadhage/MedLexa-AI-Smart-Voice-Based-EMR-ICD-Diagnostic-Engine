import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyRecords } from '../services/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyRecords();
        setRecords(res.records || []);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load records. Is MongoDB running?');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name} 👋</h1>
        <p>Your personal health dashboard — view your past consultations, medications, and follow-up schedule.</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-2" style={{ marginBottom: '1.25rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #0f9d58' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Patient ID</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.patientId || '—'}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Total Visits</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{loading ? '…' : records.length}</div>
        </div>
      </div>

      {/* Records */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>📋 My Past Records</h2>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p>⏳ Loading your records…</p>
        </div>
      )}
      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', borderLeft: '4px solid var(--error)' }}>
          <p style={{ color: 'var(--error)', fontWeight: 600 }}>{error}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Records will appear here once your doctor links them to your email address.
          </p>
        </div>
      )}
      {!loading && !error && records.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No records yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
            Once your doctor completes a consultation and links it to your email
            (<strong>{user?.email}</strong>), your records will appear here.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-success">🔒 Secure</span>
            <span className="badge badge-warning">📅 Follow-up Reminders</span>
            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>💊 Medications</span>
          </div>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {records.map(rec => (
            <div key={rec._id} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {rec.emrData?.diagnosis || rec.emrData?.chiefComplaint || 'Consultation'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Dr. {rec.doctorName} · {fmt(rec.createdAt)}</div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.7rem', fontSize: '0.82rem' }}
                  onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}
                >
                  {expanded === rec._id ? '▲ Hide' : '▼ View Details'}
                </button>
              </div>

              {expanded === rec._id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  {rec.transcript && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Transcript</div>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{rec.transcript}</p>
                    </div>
                  )}
                  {rec.emrData?.symptoms?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Symptoms</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {rec.emrData.symptoms.map((s, i) => (
                          <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.8rem' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {rec.emrData?.medications?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Medications</div>
                      <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                        {rec.emrData.medications.map((m, i) => (
                          <li key={i} style={{ fontSize: '0.88rem', marginBottom: '0.2rem' }}>
                            <strong>{m.name}</strong>{m.dose ? ` — ${m.dose}` : ''}{m.freq ? ` · ${m.freq}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rec.emrData?.treatmentPlan && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Treatment Plan</div>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{rec.emrData.treatmentPlan}</p>
                    </div>
                  )}
                  {rec.emrData?.followUp && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Follow-up</div>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{rec.emrData.followUp}</p>
                    </div>
                  )}
                  {rec.audio?.url && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Audio Recording</div>
                      <audio controls src={`http://localhost:5000${rec.audio.url}`} style={{ width: '100%', maxWidth: 400 }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: '#e8f5e9', borderRadius: 'var(--radius-sm)', border: '1px solid #a5d6a7', fontSize: '0.875rem', color: '#2e7d32' }}>
        <strong>ℹ Patient Portal:</strong> Your personal health information is protected. Only you and your authorized doctor can view this data.
      </div>
    </div>
  );
}
