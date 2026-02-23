import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRecords, deleteRecord } from '../services/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const map = {
    transcribed: { bg: '#e3f2fd', color: '#1565c0', label: 'Transcribed' },
    extracted:   { bg: '#fff8e1', color: '#f57f17', label: 'EMR Extracted' },
    completed:   { bg: '#e8f5e9', color: '#1b5e20', label: '✅ Completed' },
  };
  const s = map[status] || { bg: '#f5f5f5', color: '#616161', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
      <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.4rem' }}>{label}:</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
      {items.map((item, i) => (
        <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 99, padding: '0.15rem 0.6rem', fontSize: '0.8rem', fontWeight: 500 }}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function DoctorRecords() {
  const navigate = useNavigate();
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState(null); // record._id that is open

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyRecords();
        setRecords(res.records || []);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load records.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteRecord(id);
      setRecords(r => r.filter(rec => rec._id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err) {
      alert(err?.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !q
      || (r.patientName || '').toLowerCase().includes(q)
      || (r.patientEmail || '').toLowerCase().includes(q)
      || (r.emrData?.diagnosis || '').toLowerCase().includes(q)
      || (r.emrData?.chiefComplaint || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <h1>📁 Patient Records</h1>
        <p>Click any record to expand the full EMR details.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-2" style={{ marginBottom: '1.25rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Total Records</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{records.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #0f9d58' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Completed EMRs</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{records.filter(r => r.status === 'completed' || r.status === 'extracted').length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem' }}>
        <input type="text" className="form-input" placeholder="🔍  Search by patient name, email, diagnosis…"
          value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
          <p>Loading records from database…</p>
        </div>
      )}
      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', borderLeft: '4px solid var(--error)' }}>
          <p style={{ color: 'var(--error)', fontWeight: 600 }}>{error}</p>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ marginBottom: '0.5rem' }}>{search ? 'No matching records' : 'No records yet'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {search ? 'Try a different search term.' : 'Go to Record & Upload to start a new consultation.'}
          </p>
          {!search && <button className="btn btn-primary" onClick={() => navigate('/record-upload')}>+ New Consultation</button>}
        </div>
      )}

      {/* Record Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(rec => {
            const isOpen = expanded === rec._id;
            const emr = rec.emrData || {};
            const symptoms = typeof emr.symptoms === 'string'
              ? emr.symptoms.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
              : (Array.isArray(emr.symptoms) ? emr.symptoms : []);
            const meds = Array.isArray(emr.medications) ? emr.medications : [];
            const vitals = emr.vitals || {};

            return (
              <div key={rec._id} className="card" style={{ padding: 0, overflow: 'hidden', border: isOpen ? '1.5px solid var(--primary)' : '1px solid var(--border)' }}>

                {/* ── Card Header (always visible) ── */}
                <div
                  style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem',
                    background: isOpen ? 'var(--primary-light)' : '#fff' }}
                  onClick={() => setExpanded(isOpen ? null : rec._id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {rec.patientName || <em style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Unnamed patient</em>}
                      </span>
                      {rec.patientId && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>· {rec.patientId}</span>}
                      <StatusBadge status={rec.status} />
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {emr.diagnosis && <><strong>Dx:</strong> {emr.diagnosis}{emr.icdCodes?.length > 0 && <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>({emr.icdCodes.map(c => c.code || c).join(', ')})</span>} · </>}
                      {emr.chiefComplaint && <><strong>CC:</strong> {emr.chiefComplaint}</>}
                      {!emr.diagnosis && !emr.chiefComplaint && <em style={{ color: 'var(--text-muted)' }}>Transcribed only — EMR not extracted</em>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', minWidth: 130 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmt(rec.createdAt)}</span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button className="btn btn-secondary"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.78rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                        onClick={e => { e.stopPropagation(); handleDelete(rec._id); }}
                        disabled={deleting === rec._id}>
                        {deleting === rec._id ? '…' : '🗑 Delete'}
                      </button>
                      <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </div>

                {/* ── Expanded EMR Detail ── */}
                {isOpen && (
                  <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', background: '#fafbfc' }}>

                    {/* Patient Info */}
                    <Section icon="👤" title="Patient Information">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 2rem' }}>
                        <Field label="Name"       value={rec.patientName} />
                        <Field label="Email"      value={rec.patientEmail} />
                        <Field label="Patient ID" value={rec.patientId} />
                        <Field label="Doctor"     value={rec.doctorName} />
                      </div>
                    </Section>

                    {/* Diagnosis & Chief Complaint */}
                    <Section icon="🩺" title="Diagnosis">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 2rem' }}>
                        <Field label="Chief Complaint" value={emr.chiefComplaint} />
                        <Field label="Diagnosis"       value={emr.diagnosis} />
                        {emr.icdCodes?.length > 0 && (
                          <div style={{ gridColumn: '1/-1', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.4rem' }}>ICD-10 Codes:</span>
                            {emr.icdCodes.map((c, i) => (
                              <span key={i} style={{ marginRight: '0.6rem', background: '#e8eaf6', color: '#3949ab', borderRadius: 4, padding: '0.1rem 0.45rem', fontFamily: 'monospace', fontSize: '0.83rem', fontWeight: 700 }}>
                                {c.code || c}{c.description && <span style={{ fontFamily: 'inherit', fontWeight: 400 }}> — {c.description}</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Section>

                    {/* Symptoms */}
                    {symptoms.length > 0 && (
                      <Section icon="🤒" title="Symptoms">
                        <TagList items={symptoms} />
                      </Section>
                    )}

                    {/* Vitals */}
                    {Object.values(vitals).some(Boolean) && (
                      <Section icon="📊" title="Vitals">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem 1rem', fontSize: '0.875rem' }}>
                          {vitals.bp         && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>BP</span><br/><strong>{vitals.bp}</strong></div>}
                          {vitals.heartRate  && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>HR</span><br/><strong>{vitals.heartRate} bpm</strong></div>}
                          {vitals.temperature && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>Temp</span><br/><strong>{vitals.temperature}°F</strong></div>}
                          {vitals.oxygenSaturation && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>SpO₂</span><br/><strong>{vitals.oxygenSaturation}%</strong></div>}
                          {vitals.respiratoryRate && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>RR</span><br/><strong>{vitals.respiratoryRate}/min</strong></div>}
                          {vitals.weight     && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>Weight</span><br/><strong>{vitals.weight} kg</strong></div>}
                          {vitals.height     && <div><span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>Height</span><br/><strong>{vitals.height} cm</strong></div>}
                        </div>
                      </Section>
                    )}

                    {/* Medications */}
                    {meds.length > 0 && (
                      <Section icon="💊" title="Medications">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg)' }}>
                              {['Medication', 'Dose', 'Frequency'].map(h => (
                                <th key={h} style={{ padding: '0.35rem 0.6rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {meds.filter(m => m.name || m.medication || m.drug).map((m, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.35rem 0.6rem', fontWeight: 600 }}>{m.name || m.medication || m.drug}</td>
                                <td style={{ padding: '0.35rem 0.6rem', color: 'var(--text-secondary)' }}>{m.dose || m.dosage || '—'}</td>
                                <td style={{ padding: '0.35rem 0.6rem', color: 'var(--text-secondary)' }}>{m.frequency || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Section>
                    )}

                    {/* Treatment Plan & Follow-up */}
                    {(emr.treatmentPlan || emr.followUp) && (
                      <Section icon="📋" title="Treatment Plan & Follow-up">
                        <Field label="Treatment Plan" value={emr.treatmentPlan} />
                        <Field label="Follow-up"      value={emr.followUp} />
                      </Section>
                    )}

                    {/* Patient Summary */}
                    {rec.patientSummary && (
                      <Section icon="🧑‍⚕️" title="Patient-friendly Summary">
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                          {rec.patientSummary}
                        </p>
                      </Section>
                    )}

                    {/* Transcript */}
                    {rec.transcript && (
                      <Section icon="📝" title="Consultation Transcript">
                        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--text-secondary)', maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                          {rec.transcript}
                        </div>
                      </Section>
                    )}

                    {/* Audio */}
                    {rec.audio?.url && (
                      <Section icon="🎙️" title="Consultation Audio">
                        <audio controls src={`http://localhost:5000${rec.audio.url}`}
                          style={{ width: '100%', maxWidth: 500 }} />
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          {rec.audio.originalName} · {rec.audio.size ? `${(rec.audio.size / 1024).toFixed(1)} KB` : ''}
                        </div>
                      </Section>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
