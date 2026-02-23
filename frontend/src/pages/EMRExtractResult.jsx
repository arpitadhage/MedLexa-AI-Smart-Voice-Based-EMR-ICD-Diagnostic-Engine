import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveRecord } from '../services/api';

/* ─── EMR display helpers ───────────────────────────────────────────── */
const ELabel = ({ children }) => (
  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{children}</div>
);
const ETagList = ({ label, items }) => (
  <div style={{ marginBottom: '1rem' }}>
    <ELabel>{label}</ELabel>
    {items?.length ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.15rem' }}>
        {items.map((it, i) => (
          <span key={i} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.22rem 0.65rem', borderRadius: 999, fontSize: '0.82rem', fontWeight: 500 }}>{it}</span>
        ))}
      </div>
    ) : <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>None mentioned</span>}
  </div>
);
const EPlanList = ({ label, items }) => (
  <div style={{ marginBottom: '1rem' }}>
    <ELabel>{label}</ELabel>
    {items?.length ? (
      <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
        {items.map((p, i) => <li key={i} style={{ fontSize: '0.88rem', marginBottom: '0.3rem', lineHeight: 1.6 }}>{p}</li>)}
      </ol>
    ) : <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>None mentioned</span>}
  </div>
);
const EVitals = ({ vitals }) => {
  if (!vitals) return <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>None mentioned</span>;
  const rows = [
    ['bloodPressure','Blood Pressure','🩺'],['heartRate','Heart Rate','❤️'],
    ['temperature','Temperature','🌡️'],['respiratoryRate','Resp. Rate','🫁'],
    ['oxygenSaturation','O₂ Sat','💨'],['weight','Weight','⚖️'],['height','Height','📏'],
  ].filter(([k]) => vitals[k]);
  if (!rows.length) return <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>None mentioned</span>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.55rem' }}>
      {rows.map(([k, lbl, icon]) => (
        <div key={k} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.55rem 0.75rem' }}>
          <div style={{ fontSize: '1rem' }}>{icon}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lbl}</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{vitals[k]}</div>
        </div>
      ))}
    </div>
  );
};
const EMedsTable = ({ meds }) => {
  if (!meds?.length) return <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>None mentioned</span>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
      <thead><tr style={{ background: 'var(--bg)' }}>
        {['Medication','Dose','Frequency'].map(h => (
          <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>{meds.map((m, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>{m.name}</td>
          <td style={{ padding: '0.4rem 0.6rem' }}>{m.dose || '—'}</td>
          <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>{m.frequency || '—'}</td>
        </tr>
      ))}</tbody>
    </table>
  );
};

/* ─── Step indicator ────────────────────────────────────────────────── */
function StepBar({ active = 3 }) {
  const steps = [
    { n: 1, label: 'Record / Upload' },
    { n: 2, label: 'Transcribe' },
    { n: 3, label: 'Extract EMR' },
    { n: 4, label: 'Fill EMR Form' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '1rem', flexWrap: 'wrap' }}>
      {steps.map(({ n, label }, idx, arr) => {
        const done = n < active;
        const current = n === active;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: done || current ? 'var(--primary)' : 'var(--border)',
                color: done || current ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
              }}>{n}</div>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: done || current ? 600 : 400,
                color: done || current ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>{label}</span>
            </div>
            {idx < arr.length - 1 && (
              <div style={{ flex: '0 0 2rem', height: 2, background: done ? 'var(--primary)' : 'var(--border)', margin: '0 0.25rem' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function EMRExtractResult() {
  const location = useLocation();
  const navigate  = useNavigate();
  const state     = location.state || {};

  // Prefer location state; fall back to sessionStorage when refreshing or navigating
  const rawEMR      = state.emrResult || (() => {
    try { return JSON.parse(sessionStorage.getItem('consultEMR') || 'null'); } catch { return null; }
  })();
  const transcript  = state.transcript || sessionStorage.getItem('consultTranscript') || '';
  const emrResult   = rawEMR;

  const [savedRecordId, setSavedRecordId] = useState(
    sessionStorage.getItem('consultRecordId') || null
  );
  const [saveStatus, setSaveStatus] = useState(savedRecordId ? 'saved' : 'idle');

  // Caretaker send state
  const [caretakerToast, setCaretakerToast]   = useState(null); // {type:'success'|'hospitalisation', name}
  const [showCaretakerModal, setShowCaretakerModal] = useState(false);
  const [modalSearch, setModalSearch]         = useState('');
  const [modalResults, setModalResults]       = useState([]);

  // Search patients in localStorage as user types in the modal
  useEffect(() => {
    if (modalSearch.length >= 2) {
      const all = JSON.parse(localStorage.getItem('emr_patients') || '[]');
      setModalResults(
        all.filter(p =>
          p.name?.toLowerCase().includes(modalSearch.toLowerCase()) ||
          p.id?.toLowerCase().includes(modalSearch.toLowerCase())
        ).slice(0, 5)
      );
    } else {
      setModalResults([]);
    }
  }, [modalSearch]);

  // Auto-save to DB once when EMR data is available
  useEffect(() => {
    if (!emrResult?.data || savedRecordId) return;
    (async () => {
      try {
        setSaveStatus('saving');
        const audio = (() => {
          try { return JSON.parse(sessionStorage.getItem('consultAudio') || 'null'); } catch { return null; }
        })();
        const res = await saveRecord({
          transcript,
          isDemo:   sessionStorage.getItem('consultIsDemo') === 'true',
          audio,
          emrData:  emrResult.data,
          status:   'extracted',
        });
        const rid = res.record._id;
        setSavedRecordId(rid);
        setSaveStatus('saved');
        sessionStorage.setItem('consultRecordId', rid);
      } catch (err) {
        console.warn('Auto-save failed:', err?.response?.data?.error || err.message);
        setSaveStatus('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEMRForm = () => {
    if (!emrResult?.data) return;
    sessionStorage.setItem('emrAutoFill', JSON.stringify({
      ...emrResult.data,
      transcript,
      aiSummary: `Diagnosis: ${emrResult.data.diagnosis || '—'}. Chief complaint: ${emrResult.data.chiefComplaint || '—'}.`,
    }));
    navigate('/emr-form');
  };

  /* ── Caretaker send logic ─────────────────────────────────────────── */
  const HOSP_KEYWORDS = [
    'admit','admitted','hospitalise','hospitalize','ward','icu',
    'intensive care','inpatient','shifted to','bed rest admitted',
  ];

  const isHospitalised = (emrData) => {
    const text = [
      emrData.diagnosis || '',
      emrData.chiefComplaint || '',
      ...(emrData.plan || []),
      emrData.followUp || '',
    ].join(' ').toLowerCase();
    return HOSP_KEYWORDS.some(kw => text.includes(kw));
  };

  const medsText = (meds = []) =>
    meds.map(m => typeof m === 'string' ? m : `${m.name || ''} ${m.dose || ''} ${m.frequency || ''}`.trim())
      .filter(Boolean).join('\n• ');

  const sendToCaretaker = (patient) => {
    setShowCaretakerModal(false);
    const { caretaker_name = '', caretaker_phone = '' } = patient;
    if (!caretaker_phone) {
      alert('No caretaker phone registered for this patient.\nPlease update patient details first.');
      return;
    }
    const hospitalised = isHospitalised(d);
    const meds = medsText(d.medications);
    const planText = (d.plan || []).join('; ') || '—';

    const message = hospitalised
      ? `⚠️ URGENT — HOSPITALISATION ALERT\n\nDear ${caretaker_name || 'Caretaker'},\nYour patient (${patient.name}) has been admitted/hospitalised.\n\nDiagnosis: ${d.diagnosis || '—'}\nChief Complaint: ${d.chiefComplaint || '—'}\n\nCurrent Medications:\n• ${meds || 'See doctor'}\n\nTreatment Plan: ${planText}\nFollow-up: ${d.followUp || 'As advised'}\n\n— Smart EMR System`
      : `💊 Prescription Update\n\nDear ${caretaker_name || 'Caretaker'},\nHere is the latest prescription for ${patient.name}:\n\nDiagnosis: ${d.diagnosis || '—'}\n\nMedications:\n• ${meds || 'None prescribed'}\n\nTreatment Plan: ${planText}\nFollow-up: ${d.followUp || 'As advised'}\n\n— Smart EMR System`;

    // Save notification
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifs.push({
      sent_at: new Date().toISOString(),
      caretaker_name,
      caretaker_phone,
      patient_name: patient.name,
      type: hospitalised ? 'hospitalisation' : 'prescription',
      medications: d.medications || [],
      status: 'sent',
    });
    localStorage.setItem('notifications', JSON.stringify(notifs));

    // Open WhatsApp
    window.open(`https://wa.me/91${caretaker_phone}?text=${encodeURIComponent(message)}`, '_blank');

    // Toast
    setCaretakerToast({ type: hospitalised ? 'hospitalisation' : 'success', name: caretaker_name });
    setTimeout(() => setCaretakerToast(null), 5000);
  };

  if (!emrResult?.data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <h2 style={{ marginBottom: '0.5rem' }}>No EMR Data Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Please go back to the transcript page and click "Extract Medical Data".
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/transcript-result', { state: { transcript } })}>
          ← Back to Transcript
        </button>
      </div>
    );
  }

  const d = emrResult.data;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => navigate('/transcript-result', { state: { transcript } })}
          >
            ← Back to Transcript
          </button>
          <h1 style={{ margin: 0 }}>Step 3 — Electronic Medical Record</h1>
        </div>
        <p>AI-extracted structured medical data. Review and open the full EMR form to save the record.</p>
        <StepBar active={3} />
      </div>

      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {emrResult.demo && <span className="badge badge-warning">Demo</span>}
          <span className="badge badge-success">AI Extracted</span>
          {saveStatus === 'saving' && <span className="badge" style={{ background: '#fff3e0', color: '#e65100' }}>⏳ Saving…</span>}
          {saveStatus === 'saved'  && <span className="badge badge-success">✅ Saved to DB</span>}
          {saveStatus === 'error'  && <span className="badge badge-danger" title="Could not save — MongoDB may not be running">⚠ Save failed</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }} onClick={() => window.print()}>
            🖨 Print
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', background: '#10b981', color: '#fff', border: 'none' }}
            onClick={() => { setShowCaretakerModal(true); setModalSearch(''); setModalResults([]); }}
          >
            📤 Send Medications to Caretaker
          </button>
          <button className="btn btn-primary btn-lg" onClick={openEMRForm}>
            📋 Open EMR Form → Step 4
          </button>
        </div>
      </div>

      {/* Row 1: Chief Complaint + Diagnosis */}
      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <ELabel>Chief Complaint</ELabel>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5 }}>{d.chiefComplaint || '—'}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <ELabel>Diagnosis</ELabel>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5 }}>
            {d.diagnosis || '—'}
            {d.icdCode && (
              <span style={{ marginLeft: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                {d.icdCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Symptoms */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <ETagList label="Symptoms" items={d.symptoms} />
      </div>

      {/* Row 3: Vitals */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <ELabel>Vitals</ELabel>
        <EVitals vitals={d.vitals} />
      </div>

      {/* Row 4: Medications */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <ELabel>Medications</ELabel>
        <EMedsTable meds={d.medications} />
      </div>

      {/* Row 5: Treatment Plan + Follow-up */}
      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <EPlanList label="Treatment Plan" items={d.plan} />
        </div>
        <div className="card">
          <ELabel>Follow-up</ELabel>
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{d.followUp || 'Not specified'}</div>
        </div>
      </div>

      {emrResult.demo && (
        <div style={{ marginBottom: '1rem', padding: '0.7rem 1rem', background: '#fff3cd', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#856404' }}>
          ⚠ <strong>Demo mode</strong> — set <code>GROQ_API_KEY</code> in <code>backend/.env</code> for live AI extraction.
        </div>
      )}

      {/* Bottom CTA */}
      <div className="card" style={{ border: '2px solid var(--primary)', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
            📋 Ready to fill the EMR Form?
          </div>
          <div style={{ fontSize: '0.855rem', color: 'var(--text-secondary)' }}>
            All extracted fields will be auto-populated into the full EMR form.
          </div>
        </div>
        <button className="btn btn-primary btn-lg" style={{ minWidth: 220 }} onClick={openEMRForm}>
          Open EMR Form → Step 4
        </button>
      </div>

      {/* ── Caretaker Toast ─────────────────────────────────────────────── */}
      {caretakerToast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '0.75rem 1.4rem', borderRadius: 10, fontWeight: 600,
          fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          background: caretakerToast.type === 'hospitalisation' ? '#fef2f2' : '#f0fdf4',
          color:      caretakerToast.type === 'hospitalisation' ? '#b91c1c'  : '#166534',
          border: `1px solid ${caretakerToast.type === 'hospitalisation' ? '#fca5a5' : '#86efac'}`,
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          {caretakerToast.type === 'hospitalisation'
            ? '⚠️ Hospitalisation detected — Sending urgent alert to caretaker'
            : `✅ Prescription sent to ${caretakerToast.name || 'caretaker'} via WhatsApp`}
          <button onClick={() => setCaretakerToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* ── Patient Picker Modal ─────────────────────────────────────────── */}
      {showCaretakerModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowCaretakerModal(false); }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '1.5rem', width: '100%',
            maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>📤 Select Patient to Notify Caretaker</div>
              <button onClick={() => setShowCaretakerModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.5 }}>✕</button>
            </div>
            <div style={{ fontSize: '0.83rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              Search the patient whose caretaker should receive the prescription/alert.
            </div>
            <input
              type="text"
              autoFocus
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              placeholder="Search by name or ID…"
              style={{
                width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8,
                border: '1.5px solid #d1d5db', fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box', marginBottom: '0.6rem',
              }}
            />
            {modalSearch.length >= 2 && modalResults.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '0.75rem 0' }}>
                No patient found.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 260, overflowY: 'auto' }}>
              {modalResults.map(p => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.65rem 0.85rem',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  onClick={() => sendToCaretaker(p)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>{p.id} • {p.age}y {p.gender}</div>
                    {p.caretaker_name
                      ? <div style={{ fontSize: '0.76rem', color: '#10b981', marginTop: '0.15rem' }}>🧑‍⚕️ {p.caretaker_name} · {p.caretaker_phone}</div>
                      : <div style={{ fontSize: '0.76rem', color: '#ef4444', marginTop: '0.15rem' }}>⚠ No caretaker registered</div>}
                  </div>
                  <button style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    Send →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
