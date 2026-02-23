import React, { useState } from 'react';
import { extractMedicalData } from '../services/api';

const SAMPLE_TRANSCRIPT =
  'Patient presents with persistent headache for the past three days. Reports pain level 7 out of 10. Blood pressure 138/88 mmHg. No fever or nausea. History of migraines. Prescribed ibuprofen 400mg every 6 hours and advised rest and hydration. Follow up in one week.';

/* ─── Small reusable components ─────────────────────────────────────── */
const Label = ({ children }) => (
  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
    {children}
  </div>
);

const Field = ({ label, value, fallback = '—' }) => (
  <div style={{ marginBottom: '1rem' }}>
    <Label>{label}</Label>
    <div style={{ fontSize: '0.925rem', color: value ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.6 }}>
      {value || fallback}
    </div>
  </div>
);

const TagList = ({ label, items }) => (
  <div style={{ marginBottom: '1rem' }}>
    <Label>{label}</Label>
    {items && items.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.15rem' }}>
        {items.map((item, i) => (
          <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.82rem', fontWeight: 500 }}>
            {item}
          </span>
        ))}
      </div>
    ) : (
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None mentioned</div>
    )}
  </div>
);

const PlanList = ({ label, items }) => (
  <div style={{ marginBottom: '1rem' }}>
    <Label>{label}</Label>
    {items && items.length > 0 ? (
      <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
        {items.map((p, i) => (
          <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.6 }}>{p}</li>
        ))}
      </ol>
    ) : (
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None mentioned</div>
    )}
  </div>
);

const VitalsGrid = ({ vitals }) => {
  if (!vitals) return <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None mentioned</div>;
  const entries = [
    { key: 'bloodPressure',    label: 'Blood Pressure',   icon: '🩺' },
    { key: 'heartRate',        label: 'Heart Rate',        icon: '❤️' },
    { key: 'temperature',      label: 'Temperature',       icon: '🌡️' },
    { key: 'respiratoryRate',  label: 'Respiratory Rate',  icon: '🫁' },
    { key: 'oxygenSaturation', label: 'O₂ Saturation',    icon: '💨' },
    { key: 'weight',           label: 'Weight',            icon: '⚖️' },
    { key: 'height',           label: 'Height',            icon: '📏' },
  ].filter((e) => vitals[e.key]);

  if (entries.length === 0)
    return <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None mentioned</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
      {entries.map(({ key, label, icon }) => (
        <div key={key} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{icon}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.1rem' }}>{vitals[key]}</div>
        </div>
      ))}
    </div>
  );
};

const MedsTable = ({ meds }) => {
  if (!meds || meds.length === 0)
    return <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>None mentioned</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
      <thead>
        <tr style={{ background: 'var(--bg)' }}>
          {['Medication', 'Dose', 'Frequency'].map((h) => (
            <th key={h} style={{ padding: '0.45rem 0.65rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {meds.map((m, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '0.45rem 0.65rem', fontWeight: 600 }}>{m.name}</td>
            <td style={{ padding: '0.45rem 0.65rem' }}>{m.dose || '—'}</td>
            <td style={{ padding: '0.45rem 0.65rem', color: 'var(--text-secondary)' }}>{m.frequency || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function GenerateEMR() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await extractMedicalData(transcript);
      setResult(res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  const emr = result?.data;

  return (
    <div>
      <div className="page-header">
        <h1>Generate EMR</h1>
        <p>Paste a consultation transcript — the AI extracts structured clinical data instantly.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: emr ? '420px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Input panel ────────────────────────────── */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>📝 Consultation Transcript</h2>
          <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Paste or type the transcript, then click Extract.
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Enter consultation transcript here…"
            style={{ width: '100%', minHeight: 240, padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.7, resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: 'var(--bg)' }}
          />
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-success btn-lg" style={{ flex: 1 }} disabled={loading || !transcript.trim()} onClick={handleExtract}>
              {loading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Extracting…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Extract Medical Data
                </>
              )}
            </button>
            <button className="btn btn-secondary" onClick={() => { setTranscript(''); setResult(null); setError(''); }} disabled={loading}>
              Clear
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '0.75rem', padding: '0.7rem 1rem', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
              ✗ {error}
            </div>
          )}

          {result?.demo && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 1rem', background: '#fff3cd', color: '#856404', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              ⚠ <strong>Demo mode</strong> — set <code>GROQ_API_KEY</code> in <code>backend/.env</code> for live LLM extraction.
            </div>
          )}

          <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
        </div>

        {/* ── Structured EMR output ───────────────────── */}
        {emr && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>🏥 Extracted Clinical Data</div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {result?.demo && <span className="badge badge-warning">Demo</span>}
                <span className="badge badge-success">AI Extracted</span>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => window.print()}>🖨 Print</button>
              </div>
            </div>

            {/* Row 1: Chief Complaint + Diagnosis */}
            <div className="grid grid-2">
              <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <Label>Chief Complaint</Label>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {emr.chiefComplaint || '—'}
                </div>
              </div>
              <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                <Label>Diagnosis</Label>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {emr.diagnosis || '—'}
                  {emr.icdCode && (
                    <span style={{ marginLeft: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                      {emr.icdCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Symptoms */}
            <div className="card">
              <TagList label="Symptoms" items={emr.symptoms} />
            </div>

            {/* Row 3: Vitals */}
            <div className="card">
              <Label>Vitals</Label>
              <VitalsGrid vitals={emr.vitals} />
            </div>

            {/* Row 4: Medications */}
            <div className="card">
              <Label>Medications</Label>
              <MedsTable meds={emr.medications} />
            </div>

            {/* Row 5: Plan + Follow-up */}
            <div className="grid grid-2">
              <div className="card">
                <PlanList label="Treatment Plan" items={emr.plan} />
              </div>
              <div className="card">
                <Field label="Follow-up" value={emr.followUp} fallback="Not specified" />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
