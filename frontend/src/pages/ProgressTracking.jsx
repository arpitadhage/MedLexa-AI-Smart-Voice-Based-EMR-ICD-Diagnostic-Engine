import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  getAllPatients, seedDummyDataIfEmpty, savePatient, getPatientsFromAPI,
} from '../utils/database';
import {
  getMetricsForCondition, autoDetectMetrics,
  METRIC_LABELS, METRIC_ICONS,
} from '../data/conditionMetrics';

/* ───────────────────────────────────────────────
   Tiny helpers & style atoms
─────────────────────────────────────────────── */
const card = (extra = {}) => ({
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm, 8px)',
  padding: '1rem 1.25rem',
  ...extra,
});

const Badge = ({ children, color = '#1a73e8', bg }) => (
  <span style={{
    background: bg || (color + '18'), color,
    border: `1px solid ${color}44`, borderRadius: 99,
    padding: '0.18rem 0.7rem', fontSize: '0.75rem', fontWeight: 700,
  }}>{children}</span>
);

const Spinner = () => (
  <div style={{ display: 'inline-block', width: 18, height: 18, border: '2.5px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* Compute % change */
function pctChange(from, to) {
  if (from === null || to === null || from === 0) return null;
  return (((to - from) / Math.abs(from)) * 100).toFixed(1);
}

/* Status of a single value vs target */
function valueStatus(key, value, targets) {
  const t = targets?.[key];
  if (!t || value === null) return 'unknown';
  const { min, max } = t;
  if (min !== null && max !== null) {
    if (value < min || value > max) return 'critical';
    const range = max - min;
    const margin = range * 0.15;
    if (value <= min + margin || value >= max - margin) return 'watch';
    return 'normal';
  }
  return 'normal';
}

const statusColors = {
  normal: '#16a34a', improving: '#2563eb',
  watch: '#d97706', critical: '#dc2626', unknown: '#6b7280',
};

/* Compare two medication arrays and label each */
function diffMedications(prevMeds = [], currMeds = []) {
  const prev = prevMeds.map(m => String(m).toLowerCase().trim());
  const curr = currMeds.map(m => String(m).toLowerCase().trim());
  const result = [];
  curr.forEach((m, i) => {
    const origName = currMeds[i];
    if (!prev.includes(m)) result.push({ name: origName, status: 'started' });
    else result.push({ name: origName, status: 'continued' });
  });
  prev.forEach((m, i) => {
    if (!curr.includes(m)) result.push({ name: prevMeds[i], status: 'stopped' });
  });
  return result;
}

const medBadgeStyle = {
  started:   { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
  continued: { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
  stopped:   { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', textDecoration: 'line-through' },
  increased: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' },
};

/* ── Custom tooltip for recharts ── */
function CustomTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#374151' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: <strong>{p.value}{unit}</strong>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Add Visit Modal
═══════════════════════════════════════════════════ */
function AddVisitModal({ patient, onClose, onSaved }) {
  const metrics = useMemo(() => {
    const cm = getMetricsForCondition(patient?.diagnosis);
    return [...(cm.primary || []), ...(cm.secondary || [])];
  }, [patient]);

  const [fields, setFields] = useState({});
  const [meds, setMeds] = useState((patient?.visits?.slice(-1)[0]?.medications || []).map(String));
  const [newMed, setNewMed] = useState('');
  const [notes, setNotes] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const ALL_VITALS = [
    { key: 'glucose', label: 'Blood Glucose (mg/dL)' },
    { key: 'hba1c', label: 'HbA1c (%)' },
    { key: 'bp_systolic', label: 'BP Systolic (mmHg)' },
    { key: 'bp_diastolic', label: 'BP Diastolic (mmHg)' },
    { key: 'heart_rate', label: 'Heart Rate (bpm)' },
    { key: 'temperature', label: 'Temperature (°F)' },
    { key: 'spo2', label: 'SpO₂ (%)' },
    { key: 'weight', label: 'Weight (kg)' },
    { key: 'respiratory_rate', label: 'Respiratory Rate (/min)' },
    { key: 'peak_flow', label: 'Peak Flow (L/min)' },
    { key: 'pain_score', label: 'Pain Score (/10)' },
    { key: 'sleep_hours', label: 'Sleep Hours' },
    { key: 'phq9_score', label: 'PHQ-9 Score' },
    { key: 'gad7_score', label: 'GAD-7 Score' },
    { key: 'creatinine', label: 'Creatinine (mg/dL)' },
    { key: 'hemoglobin', label: 'Hemoglobin (g/dL)' },
    { key: 'tsh_level', label: 'TSH Level (mIU/L)' },
  ].filter(v => metrics.includes(v.key));

  const handleSave = () => {
    setSaving(true);
    const vitals = {};
    Object.entries(fields).forEach(([k, v]) => { if (v !== '') vitals[k] = parseFloat(v); });
    savePatient({
      patient_id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      diagnosis: patient.diagnosis,
      icd_code: patient.icd_code,
      vitals: { ...vitals, visit_date_override: visitDate },
      medications: meds,
      doctor_notes: notes,
    });
    setSaving(false);
    onSaved && onSaved();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>➕ Add New Visit — {patient.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>VISIT DATE</label>
          <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Vitals */}
        {ALL_VITALS.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>VITALS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {ALL_VITALS.map(v => (
                <div key={v.key}>
                  <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: 2 }}>{v.label}</label>
                  <input type="number" placeholder={v.label} value={fields[v.key] || ''}
                    onChange={e => setFields(f => ({ ...f, [v.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>MEDICATIONS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {meds.map((m, i) => (
              <span key={i} style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 99, padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                {m}
                <span onClick={() => setMeds(ms => ms.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer', fontWeight: 900 }}>✕</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={newMed} onChange={e => setNewMed(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newMed.trim()) { setMeds(m => [...m, newMed.trim()]); setNewMed(''); } }}
              placeholder="Add medication (press Enter)" style={{ flex: 1, padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', fontFamily: 'inherit' }} />
            <button onClick={() => { if (newMed.trim()) { setMeds(m => [...m, newMed.trim()]); setNewMed(''); } }}
              style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.45rem 0.9rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+</button>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>DOCTOR NOTES</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Clinical notes for this visit..." style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '0.6rem 1.4rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
            {saving ? 'Saving…' : '💾 Save Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main ProgressTracking Page
═══════════════════════════════════════════════════ */
export default function ProgressTracking() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiError, setAiError] = useState('');
  const [toast, setToast] = useState('');
  const [expandedVisit, setExpandedVisit] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const loadPatients = useCallback(async () => {
    seedDummyDataIfEmpty();
    const local = getAllPatients();

    // Also pull records saved to MongoDB (existing patients like Swayam,
    // new patients entered via EMR form, etc.)
    let apiPatients = [];
    try { apiPatients = await getPatientsFromAPI(); } catch { /* offline */ }

    // Merge: for patients that appear in BOTH (matched by id or name),
    // combine their visits (avoiding timestamp duplicates).
    // Patients only in the API are appended as new entries.
    const merged = [...local];
    for (const ap of apiPatients) {
      const existing = merged.find(p =>
        p.id === ap.id ||
        p.name.toLowerCase().trim() === ap.name.toLowerCase().trim()
      );
      if (!existing) {
        merged.push(ap);
      } else {
        // Deduplicate by day (YYYY-MM-DD) so a visit saved to both
        // localStorage AND MongoDB doesn't appear twice.
        const existingDates = new Set(
          existing.visits
            .map(v => (v.timestamp || '').slice(0, 10))
            .filter(Boolean)
        );
        const newVisits = ap.visits.filter(v => {
          const d = (v.timestamp || '').slice(0, 10);
          return !d || !existingDates.has(d);
        });
        if (newVisits.length > 0) {
          existing.visits = [...existing.visits, ...newVisits]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((v, i) => ({ ...v, visit_number: i + 1 }));
          existing.total_visits = existing.visits.length;
          existing.last_visit   = existing.visits[existing.visits.length - 1]?.date || '';
        }
      }
    }

    setPatients(merged);
    if (!selectedId && merged.length > 0) setSelectedId(merged[0].id);
  }, [selectedId]);

  useEffect(() => { loadPatients(); }, []); // eslint-disable-line

  const patient = useMemo(() => patients.find(p => p.id === selectedId) || null, [patients, selectedId]);
  const visits = useMemo(() => patient?.visits || [], [patient]);

  const condMetrics = useMemo(() => {
    if (!patient) return getMetricsForCondition('Default');
    return getMetricsForCondition(patient.diagnosis);
  }, [patient]);

  const primaryKeys = useMemo(() => {
    const cm = condMetrics;
    const keys = [...(cm.primary || [])];
    // If no data found for primary keys, fallback to autoDetect
    const hasData = keys.some(k => visits.some(v => v[k] != null));
    if (!hasData && visits.length > 0) return autoDetectMetrics(visits).slice(0, 4);
    return keys;
  }, [condMetrics, visits]);

  /* ── Overall progress badge ── */
  const progressBadge = useMemo(() => {
    if (visits.length < 2) return null;
    const first = visits[0];
    const last = visits[visits.length - 1];
    let improving = 0, total = 0;
    primaryKeys.forEach(k => {
      const t = condMetrics.targets?.[k];
      if (!t || first[k] == null || last[k] == null) return;
      total++;
      const pct = pctChange(first[k], last[k]);
      if (pct === null) return;
      const better = t.lower_is_better ? parseFloat(pct) < 0 : parseFloat(pct) > 0;
      if (better) improving++;
    });
    if (!total) return null;
    const ratio = improving / total;
    if (ratio >= 0.6) return { label: '✅ Improving', color: '#16a34a' };
    if (ratio >= 0.3) return { label: '🟡 Stable', color: '#d97706' };
    return { label: '🔴 Needs Attention', color: '#dc2626' };
  }, [visits, primaryKeys, condMetrics]);

  /* ── Medication timeline (compare consecutive visits) ── */
  const medTimeline = useMemo(() => {
    return visits.map((v, i) => {
      const prev = visits[i - 1];
      const diffed = prev
        ? diffMedications(prev.medications, v.medications)
        : (v.medications || []).map(m => ({ name: m, status: 'started' }));
      return { ...v, medDiff: diffed };
    });
  }, [visits]);

  /* ── AI Insights (via backend → Groq) ── */
  const generateInsights = async () => {
    if (!patient || visits.length === 0) return;
    setAiLoading(true);
    setAiError('');
    setAiInsights(null);
    try {
      const token = localStorage.getItem('emr_token');
      const res = await fetch('http://localhost:5000/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ diagnosis: patient.diagnosis, visits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backend error');
      setAiInsights(data.insights);
    } catch (e) {
      console.error('AI insights error:', e);
      setAiError('Failed to generate insights: ' + (e.message || 'Please try again.'));
    }
    setAiLoading(false);
  };

  if (patients.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading patients…</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1a73e8', color: '#fff', borderRadius: 8, padding: '0.75rem 1.25rem', fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
          {toast}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>📊 Progress Tracking</h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Monitor patient health trends over multiple visits</div>
        </div>
        {patient && (
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
          >
            ➕ Add New Visit
          </button>
        )}
      </div>

      {/* ── SECTION 1: Patient Selector ── */}
      <div style={{ ...card({ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }) }}>
        <label style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>👤 Select Patient:</label>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setAiInsights(null); setAiError(''); setExpandedVisit(null); }}
          style={{ flex: 1, minWidth: 220, padding: '0.55rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.diagnosis || 'Unknown'} ({p.total_visits} visit{p.total_visits !== 1 ? 's' : ''})
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{patients.length} patient{patients.length !== 1 ? 's' : ''} in database</span>
      </div>

      {!patient ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Select a patient to view progress</div>
      ) : (
        <>
          {/* ── SECTION 2: Patient Header ── */}
          <div style={{ ...card({ marginBottom: '1.25rem', background: 'linear-gradient(135deg,#f8faff 0%,#eef2ff 100%)', border: '1.5px solid #c7d2fe' }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{patient.name}</h2>
                  <Badge color="#6366f1">{patient.id}</Badge>
                  {progressBadge && (
                    <span style={{ background: progressBadge.color + '18', color: progressBadge.color, border: `1.5px solid ${progressBadge.color}44`, borderRadius: 99, padding: '0.2rem 0.8rem', fontSize: '0.8rem', fontWeight: 800 }}>
                      {progressBadge.label}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: '#374151', flexWrap: 'wrap' }}>
                  <span>🎂 {patient.age} yrs • {patient.gender}</span>
                  {patient.blood_group && <span>🩸 {patient.blood_group}</span>}
                  <span>🏥 {patient.diagnosis}</span>
                  {patient.icd_code && <span style={{ color: '#6b7280' }}>ICD: {patient.icd_code}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a73e8' }}>{patient.total_visits}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Total Visits</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.88rem' }}>{patient.first_visit}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>First Visit</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#374151', fontSize: '0.88rem' }}>{patient.last_visit}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>Last Visit</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Metrics Summary Cards ── */}
          {visits.length >= 1 && primaryKeys.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              {primaryKeys.map(k => {
                const first = visits[0][k];
                const latest = visits[visits.length - 1][k];
                const pct = pctChange(first, latest);
                const t = condMetrics.targets?.[k];
                const lib = t?.lower_is_better;
                const improving = pct !== null ? (lib ? parseFloat(pct) < 0 : parseFloat(pct) > 0) : false;
                const worsening = pct !== null ? (lib ? parseFloat(pct) > 0 : parseFloat(pct) < 0) : false;
                const status = valueStatus(k, latest, condMetrics.targets);
                const sc = statusColors[status] || '#6b7280';

                return (
                  <div key={k} style={{ ...card({ borderLeft: `4px solid ${improving ? '#16a34a' : worsening ? '#dc2626' : '#d97706'}` }) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{METRIC_ICONS[k]} {METRIC_LABELS[k] || k}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sc, background: sc + '18', borderRadius: 99, padding: '0.1rem 0.5rem', border: `1px solid ${sc}33` }}>
                        {status === 'normal' ? 'Normal' : status === 'watch' ? 'Watch' : status === 'critical' ? 'Critical' : '—'}
                      </span>
                    </div>
                    {first != null && latest != null ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{first}</span>
                          <span style={{ color: '#9ca3af' }}>→</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: sc }}>{latest}</span>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t?.unit || ''}</span>
                        </div>
                        {pct !== null && (
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: improving ? '#16a34a' : worsening ? '#dc2626' : '#d97706' }}>
                            {improving ? '↓' : worsening ? '↑' : '~'} {Math.abs(pct)}% {improving ? 'improvement' : worsening ? 'worsened' : 'change'}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>No data</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SECTION 4: Progress Charts ── */}
          {visits.length < 2 ? (
            <div style={{ ...card({ marginBottom: '1.25rem', textAlign: 'center', padding: '2rem', color: '#6b7280' }) }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Add more visits to see trends</div>
              <div style={{ fontSize: '0.85rem' }}>Charts appear automatically once this patient has 2+ visits</div>
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800 }}>📈 Trend Charts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '1rem' }}>
                {primaryKeys.map(k => {
                  const t = condMetrics.targets?.[k];
                  const chartData = visits.map(v => ({ name: v.date || `V${v.visit_number}`, value: v[k] ?? null, visit: v.visit_number }));
                  const hasData = chartData.some(d => d.value !== null);
                  if (!hasData) return null;

                  const allVals = chartData.filter(d => d.value !== null).map(d => d.value);
                  const dataMin = Math.min(...allVals);
                  const dataMax = Math.max(...allVals);
                  const padding = (dataMax - dataMin) * 0.3 || 5;
                  const yMin = t?.min ? Math.min(dataMin - padding, t.min - padding) : dataMin - padding;
                  const yMax = t?.max ? Math.max(dataMax + padding, t.max + padding) : dataMax + padding;

                  return (
                    <div key={k} style={{ ...card({ padding: '1rem' }) }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#1f2937' }}>
                        {METRIC_ICONS[k]} {METRIC_LABELS[k] || k} {t?.unit ? `(${t.unit})` : ''}
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          {t?.min != null && t?.max != null && (
                            <ReferenceArea
                              y1={t.min} y2={t.max}
                              fill="#d1fae5" fillOpacity={0.5}
                              label={{ value: 'Normal', position: 'insideTopRight', fontSize: 10, fill: '#16a34a' }}
                            />
                          )}
                          {t?.min != null && <ReferenceLine y={t.min} stroke="#16a34a" strokeDasharray="4 2" strokeOpacity={0.6} />}
                          {t?.max != null && <ReferenceLine y={t.max} stroke="#16a34a" strokeDasharray="4 2" strokeOpacity={0.6} />}
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[Math.floor(yMin), Math.ceil(yMax)]} tick={{ fontSize: 10 }} />
                          <Tooltip content={<CustomTooltip unit={t?.unit ? ` ${t.unit}` : ''} />} />
                          <Line
                            type="monotone" dataKey="value" name={METRIC_LABELS[k] || k}
                            stroke="#1a73e8" strokeWidth={2.5}
                            dot={{ r: 5, fill: '#1a73e8', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          )}

          {/* ── SECTION 5: Medication Timeline ── */}
          {visits.length > 0 && (
            <div style={{ ...card({ marginBottom: '1.25rem' }) }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>💊 Medication Timeline</h3>
              <div style={{ display: 'flex', gap: '0', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {medTimeline.map((v, i) => (
                  <div key={i} style={{ minWidth: 160, flex: '0 0 160px', padding: '0 0.75rem 0 0', borderRight: i < medTimeline.length - 1 ? '1px dashed #e5e7eb' : 'none', marginRight: i < medTimeline.length - 1 ? '0.75rem' : 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#374151', marginBottom: '0.5rem' }}>
                      V{v.visit_number} · {v.date}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {(v.medDiff || []).map((med, j) => (
                        <span key={j} style={{ ...medBadgeStyle[med.status], borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontWeight: 600, display: 'inline-block', lineHeight: 1.4 }}>
                          {med.status === 'started' ? '🟢 ' : med.status === 'stopped' ? '🔴 ' : med.status === 'increased' ? '🟠 ' : '🔵 '}
                          {med.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280', flexWrap: 'wrap' }}>
                <span>🟢 Started</span><span>🔵 Continued</span><span>🔴 Stopped</span>
              </div>
            </div>
          )}

          {/* ── SECTION 6: Visit History Table ── */}
          {visits.length > 0 && (
            <div style={{ ...card({ marginBottom: '1.25rem' }) }}>
              <h3 style={{ margin: '0 0 0.9rem', fontSize: '1rem', fontWeight: 800 }}>📋 Visit History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#374151' }}>#</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Date</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Key Metrics</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Medications</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Notes</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#374151' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...visits].reverse().map((v, i) => (
                      <React.Fragment key={v.visit_number}>
                        <tr style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>V{v.visit_number}</td>
                          <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>{v.date}</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {primaryKeys.filter(k => v[k] != null).map(k => (
                                <span key={k} style={{ background: '#f1f5f9', color: '#1e40af', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                                  {METRIC_LABELS[k]}: {v[k]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', maxWidth: 200 }}>
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {(v.medications || []).slice(0, 2).map((m, idx) => (
                                <span key={idx} style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 99, padding: '0.1rem 0.45rem', fontSize: '0.72rem', fontWeight: 600 }}>{m}</span>
                              ))}
                              {(v.medications || []).length > 2 && <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>+{v.medications.length - 2} more</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#6b7280', fontSize: '0.82rem', maxWidth: 200 }}>
                            {v.notes ? v.notes.slice(0, 60) + (v.notes.length > 60 ? '…' : '') : '—'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => setExpandedVisit(expandedVisit === v.visit_number ? null : v.visit_number)}
                              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#1a73e8', fontWeight: 700 }}
                            >
                              {expandedVisit === v.visit_number ? '▲ Hide' : '▼ View'}
                            </button>
                          </td>
                        </tr>
                        {expandedVisit === v.visit_number && (
                          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                            <td colSpan={6} style={{ padding: '0.75rem 1rem', background: '#f8faff' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {Object.entries(METRIC_LABELS).filter(([k]) => v[k] != null).map(([k, label]) => (
                                  <div key={k} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.4rem 0.6rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700 }}>{label}</div>
                                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1e40af' }}>{v[k]}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.82rem' }}>Medications:</div>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                {(v.medications || []).map((m, idx) => (
                                  <Badge key={idx} color="#1d4ed8">{m}</Badge>
                                ))}
                              </div>
                              {v.notes && (
                                <>
                                  <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.82rem' }}>Notes:</div>
                                  <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>{v.notes}</div>
                                </>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SECTION 7: AI Insights ── */}
          <div style={{ ...card({ marginBottom: '1.5rem' }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>🤖 AI Clinical Insights</h3>
              <button
                onClick={generateInsights}
                disabled={aiLoading}
                style={{ background: aiLoading ? '#f3f4f6' : '#7c3aed', color: aiLoading ? '#6b7280' : '#fff', border: 'none', borderRadius: 8, padding: '0.55rem 1.1rem', fontWeight: 700, fontSize: '0.85rem', cursor: aiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {aiLoading ? <><Spinner /> Analyzing…</> : '✨ Generate AI Insights'}
              </button>
            </div>

            {aiError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.88rem' }}>⚠️ {aiError}</div>
            )}

            {aiInsights && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                {/* Summary */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.9rem 1rem' }}>
                  <div style={{ fontWeight: 800, color: '#15803d', marginBottom: '0.4rem', fontSize: '0.88rem' }}>📋 Overall Summary</div>
                  <div style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.6 }}>{aiInsights.summary}</div>
                </div>
                {/* Improvements */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.9rem 1rem' }}>
                  <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: '0.4rem', fontSize: '0.88rem' }}>✅ Key Improvements</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.83rem', color: '#1e3a8a', lineHeight: 1.7 }}>
                    {(aiInsights.improvements || []).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                {/* Concerns */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.9rem 1rem' }}>
                  <div style={{ fontWeight: 800, color: '#b45309', marginBottom: '0.4rem', fontSize: '0.88rem' }}>⚠️ Areas of Concern</div>
                  {(aiInsights.concerns || []).length === 0 ? (
                    <div style={{ fontSize: '0.83rem', color: '#92400e' }}>No significant concerns identified.</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.83rem', color: '#92400e', lineHeight: 1.7 }}>
                      {aiInsights.concerns.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  )}
                </div>
                {/* Recommendations */}
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '0.9rem 1rem' }}>
                  <div style={{ fontWeight: 800, color: '#7c3aed', marginBottom: '0.4rem', fontSize: '0.88rem' }}>💡 Recommendations</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.83rem', color: '#4c1d95', lineHeight: 1.7 }}>
                    {(aiInsights.recommendations || []).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {!aiInsights && !aiError && !aiLoading && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.88rem', padding: '1.5rem 0' }}>
                Click "Generate AI Insights" to get personalized clinical analysis for this patient's visit history.
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Visit Modal */}
      {showModal && patient && (
        <AddVisitModal
          patient={patient}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            loadPatients();
            const updated = getAllPatients().find(p => p.id === selectedId);
            if (updated) {
              const vn = updated.total_visits;
              showToast(`✅ Visit ${vn} added for ${updated.name}`);
            }
          }}
        />
      )}
    </div>
  );
}
