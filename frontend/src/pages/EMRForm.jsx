import React, { useState, useEffect } from 'react';
import { getPatientSummary, saveRecord } from '../services/api';
import { suggestICDCodes } from '../data/icdCodes';
import { savePatient } from '../utils/database';
import { extractVitalsFromEMR } from '../utils/extractVitals';
import PatientSearch from '../components/PatientSearch';

/* ─────────────────────────────────────────────────────────────────────
   Helpers / small components
───────────────────────────────────────────────────────────────────── */
const emptyForm = () => ({
  patientName: '', patientAge: '', patientGender: '', patientId: '', patientContact: '',
  visitDate: new Date().toISOString().slice(0, 10),
  doctorName: '', department: 'General Medicine', visitType: 'Outpatient',
  chiefComplaint: '', symptoms: '',
  bpSystolic: '', bpDiastolic: '', heartRate: '', temperature: '',
  respiratoryRate: '', oxygenSaturation: '', weight: '', height: '',
  diagnosis: '', icdCode: '',
  medicines: [{ name: '', dose: '', frequency: '' }],
  tests: '', advice: '', followUpDate: '',
  doctorNotes: '', aiSummary: '', patientSummary: '',
  allergies: '', warnings: '',
});

const VISIT_TYPES  = ['Outpatient', 'Inpatient', 'Emergency', 'Telemedicine', 'Follow-up', 'Routine Checkup'];
const GENDERS      = ['', 'Male', 'Female', 'Other', 'Prefer not to say'];
const DEPARTMENTS  = ['General Medicine','Cardiology','Neurology','Orthopedics','Pediatrics',
  'Gynecology','Psychiatry','Dermatology','ENT','Ophthalmology','Oncology',
  'Endocrinology','Nephrology','Gastroenterology','Pulmonology','Emergency'];

const SH = ({ icon, title }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem',
                paddingBottom:'0.5rem', borderBottom:'2px solid var(--primary)' }}>
    <span style={{ fontSize:'1.1rem' }}>{icon}</span>
    <span style={{ fontWeight:700, fontSize:'0.95rem' }}>{title}</span>
  </div>
);

const FL = ({ children, ai }) => (
  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'var(--text-secondary)',
                  marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
    {children}{ai && <span style={{ marginLeft:'0.3rem', background:'#d1fae5', color:'#065f46',
      fontSize:'0.65rem', padding:'0.05rem 0.35rem', borderRadius:99, fontWeight:700 }}>AI</span>}
  </label>
);

const TI = ({ value, onChange, placeholder, type='text' }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ width:'100%', padding:'0.5rem 0.7rem', border:'1px solid var(--border)',
             borderRadius:'var(--radius-sm)', fontSize:'0.875rem', outline:'none',
             fontFamily:'inherit', background:'#fff' }} />
);

const TS = ({ value, onChange, options }) => (
  <select value={value} onChange={onChange}
    style={{ width:'100%', padding:'0.5rem 0.7rem', border:'1px solid var(--border)',
             borderRadius:'var(--radius-sm)', fontSize:'0.875rem', outline:'none',
             fontFamily:'inherit', background:'#fff' }}>
    {options.map(o => <option key={o} value={o}>{o || '— select —'}</option>)}
  </select>
);

const TA = ({ value, onChange, placeholder, rows=3 }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ width:'100%', padding:'0.5rem 0.7rem', border:'1px solid var(--border)',
             borderRadius:'var(--radius-sm)', fontSize:'0.875rem', outline:'none',
             resize:'vertical', fontFamily:'inherit', lineHeight:1.6, background:'#fff' }} />
);

const Row2 = ({ children }) => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
    {children}
  </div>
);
const Row3 = ({ children }) => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
    {children}
  </div>
);
const Field = ({ children }) => <div>{children}</div>;

/* ─────────────────────────────────────────────────────────────────────
   Print-only styles injected once
───────────────────────────────────────────────────────────────────── */
const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { font-size: 12px !important; }
  .print-section { page-break-inside: avoid; }
  .navbar, .layout-footer { display: none !important; }
  .page-header .no-print { display: none !important; }
}`;

/* ─────────────────────────────────────────────────────────────────────
   EMR Preview panel
───────────────────────────────────────────────────────────────────── */
function EMRPreview({ form }) {
  const sym = form.symptoms ? form.symptoms.split('\n').filter(Boolean) : [];
  const meds = form.medicines.filter(m => m.name);
  const plan = form.advice ? form.advice.split('\n').filter(Boolean) : [];
  return (
    <div id="emr-preview" style={{ background:'#fff', padding:'2rem', border:'1px solid var(--border)',
             borderRadius:'var(--radius)', marginTop:'1.5rem', lineHeight:1.7 }}>
      {/* Header */}
      <div style={{ textAlign:'center', borderBottom:'2px solid var(--primary)', paddingBottom:'0.75rem', marginBottom:'1.25rem' }}>
        <div style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--primary)' }}>ELECTRONIC MEDICAL RECORD</div>
        <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>
          Smart EMR & Diagnostic Assistant · Generated {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}
        </div>
      </div>

      {/* Patient + Visit side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div className="print-section">
          <div style={{ fontWeight:700, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Patient Information</div>
          {[['Name', form.patientName],['Patient ID', form.patientId],['Age', form.patientAge],
            ['Gender', form.patientGender],['Contact', form.patientContact]].map(([k,v]) => v ? (
            <div key={k} style={{ display:'flex', gap:'0.5rem', fontSize:'0.875rem', marginBottom:'0.2rem' }}>
              <span style={{ color:'var(--text-muted)', minWidth:80 }}>{k}:</span>
              <span style={{ fontWeight:500 }}>{v}</span>
            </div>
          ) : null)}
        </div>
        <div className="print-section">
          <div style={{ fontWeight:700, fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Visit Information</div>
          {[['Date', form.visitDate],['Doctor', form.doctorName],['Department', form.department],
            ['Type', form.visitType]].map(([k,v]) => v ? (
            <div key={k} style={{ display:'flex', gap:'0.5rem', fontSize:'0.875rem', marginBottom:'0.2rem' }}>
              <span style={{ color:'var(--text-muted)', minWidth:80 }}>{k}:</span>
              <span style={{ fontWeight:500 }}>{v}</span>
            </div>
          ) : null)}
        </div>
      </div>

      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', marginBottom:'1rem' }} className="print-section">
        <PreviewRow label="Chief Complaint" value={form.chiefComplaint} />
        {sym.length > 0 && (
          <div style={{ marginBottom:'0.6rem' }}>
            <span style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', color:'var(--text-muted)', letterSpacing:'0.07em' }}>Symptoms</span>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', marginTop:'0.3rem' }}>
              {sym.map((s,i) => <span key={i} style={{ background:'var(--primary-light)', color:'var(--primary)', padding:'0.2rem 0.6rem', borderRadius:999, fontSize:'0.8rem' }}>{s}</span>)}
            </div>
          </div>
        )}
        {/* Vitals grid */}
        {[form.bpSystolic,form.heartRate,form.temperature,form.oxygenSaturation].some(Boolean) && (
          <div style={{ marginBottom:'0.6rem' }}>
            <div style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', color:'var(--text-muted)', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>Vitals</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'0.4rem' }}>
              {form.bpSystolic && form.bpDiastolic && <VCard label="BP" val={`${form.bpSystolic}/${form.bpDiastolic}`} icon="🩺" />}
              {form.heartRate && <VCard label="HR" val={form.heartRate} icon="❤️" />}
              {form.temperature && <VCard label="Temp" val={form.temperature} icon="🌡️" />}
              {form.respiratoryRate && <VCard label="RR" val={form.respiratoryRate} icon="🫁" />}
              {form.oxygenSaturation && <VCard label="SpO₂" val={form.oxygenSaturation} icon="💨" />}
              {form.weight && <VCard label="Weight" val={form.weight} icon="⚖️" />}
              {form.height && <VCard label="Height" val={form.height} icon="📏" />}
            </div>
          </div>
        )}
        <PreviewRow label="Diagnosis" bold value={form.diagnosis ? `${form.diagnosis}${form.icdCode ? ` (${form.icdCode})` : ''}` : ''} />
      </div>

      {/* Medications */}
      {meds.length > 0 && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', marginBottom:'1rem' }} className="print-section">
          <div style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', color:'var(--text-muted)', letterSpacing:'0.07em', marginBottom:'0.5rem' }}>Medications</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
            <thead><tr style={{ background:'var(--bg)' }}>
              {['Medication','Dose','Frequency'].map(h => (
                <th key={h} style={{ padding:'0.38rem 0.6rem', textAlign:'left', fontWeight:600, borderBottom:'1px solid var(--border)', color:'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{meds.map((m,i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'0.38rem 0.6rem', fontWeight:600 }}>{m.name}</td>
                <td style={{ padding:'0.38rem 0.6rem' }}>{m.dose}</td>
                <td style={{ padding:'0.38rem 0.6rem', color:'var(--text-secondary)' }}>{m.frequency}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Plan + Tests */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem', marginBottom:'1rem' }} className="print-section">
        <div>
          {plan.length > 0 && <>
            <div style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', color:'var(--text-muted)', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>Treatment Plan</div>
            <ol style={{ paddingLeft:'1.2rem', margin:0 }}>{plan.map((p,i) => <li key={i} style={{ fontSize:'0.875rem', marginBottom:'0.25rem' }}>{p}</li>)}</ol>
          </>}
        </div>
        <div>
          <PreviewRow label="Tests Ordered" value={form.tests} />
          <PreviewRow label="Follow-up Date" value={form.followUpDate} />
        </div>
      </div>

      {/* Safety */}
      {(form.allergies || form.warnings) && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', marginBottom:'1rem' }} className="print-section">
          <PreviewRow label="Allergies" value={form.allergies} danger />
          <PreviewRow label="Warnings" value={form.warnings} danger />
        </div>
      )}

      {/* Notes */}
      {(form.doctorNotes || form.aiSummary) && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', marginBottom:'1rem' }} className="print-section">
          <PreviewRow label="Doctor Notes" value={form.doctorNotes} />
          <PreviewRow label="AI Clinical Summary" value={form.aiSummary} />
        </div>
      )}

      {/* Patient-friendly summary */}
      {form.patientSummary && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', background:'#f0fdf4', borderRadius:'var(--radius-sm)', padding:'1rem', marginTop:'0.5rem' }} className="print-section">
          <div style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', color:'#15803d', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>Patient View (Plain Language)</div>
          <div style={{ fontSize:'0.9rem', lineHeight:1.7 }}>{form.patientSummary}</div>
        </div>
      )}

      <div style={{ marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'0.75rem', display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--text-muted)' }}>
        <span>Doctor: {form.doctorName || '—'}</span>
        <span>Generated by Smart EMR & Diagnostic Assistant</span>
        <span>{form.visitDate}</span>
      </div>
    </div>
  );
}

const PreviewRow = ({ label, value, bold, danger }) => {
  if (!value) return null;
  return (
    <div style={{ marginBottom:'0.5rem' }}>
      <span style={{ fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', color: danger ? '#dc2626' : 'var(--text-muted)', letterSpacing:'0.07em', marginRight:'0.4rem' }}>{label}:</span>
      <span style={{ fontSize:'0.875rem', fontWeight: bold ? 700 : 400, color: danger ? '#dc2626' : 'inherit' }}>{value}</span>
    </div>
  );
};

const VCard = ({ label, val, icon }) => (
  <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'0.4rem 0.6rem', textAlign:'center' }}>
    <div style={{ fontSize:'0.9rem' }}>{icon}</div>
    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{label}</div>
    <div style={{ fontSize:'0.85rem', fontWeight:700 }}>{val}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────── */
export default function EMRForm() {
  const [form, setForm] = useState(emptyForm());
  const [aiFields, setAiFields] = useState(new Set());
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [showIcd, setShowIcd] = useState(false);
  const [patSumLoading, setPatSumLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sourceTranscript, setSourceTranscript] = useState('');
  const [dbSaveStatus, setDbSaveStatus] = useState('idle'); // idle | saving | saved | error
  // Progress tracking — patient search state
  const [consultMode, setConsultMode] = useState('search'); // 'search' | 'consult'
  const [returningPatient, setReturningPatient] = useState(null);
  const [progressToast, setProgressToast] = useState('');

  /* Load auto-fill data from session (written by one-click flow) */
  useEffect(() => {
    style_inject();
    const raw = sessionStorage.getItem('emrAutoFill');
    if (!raw) return;
    try {
      const ai = JSON.parse(raw);
      const filled = new Set();
      const p = {};
      if (ai.transcript)       { setSourceTranscript(ai.transcript); }
      if (ai.chiefComplaint)   { p.chiefComplaint = ai.chiefComplaint;  filled.add('chiefComplaint'); }
      if (ai.symptoms?.length) { p.symptoms = ai.symptoms.join('\n');   filled.add('symptoms'); }
      if (ai.diagnosis)        { p.diagnosis = ai.diagnosis;            filled.add('diagnosis'); }
      if (ai.icdCode)          { p.icdCode = ai.icdCode;                filled.add('icdCode'); }
      if (ai.plan?.length)     { p.advice = ai.plan.join('\n');         filled.add('advice'); }
      if (ai.followUp)         { p.followUpDate = ai.followUp;          filled.add('followUpDate'); }
      if (ai.aiSummary)        { p.aiSummary = ai.aiSummary;            filled.add('aiSummary'); }
      if (ai.vitals) {
        const v = ai.vitals;
        const bpParts = v.bloodPressure?.toString().replace('mmHg','').trim().split('/') || [];
        if (bpParts[0]) { p.bpSystolic  = bpParts[0].trim(); filled.add('bpSystolic'); }
        if (bpParts[1]) { p.bpDiastolic = bpParts[1].trim().split(' ')[0]; filled.add('bpDiastolic'); }
        if (v.heartRate)        { p.heartRate = v.heartRate;        filled.add('heartRate'); }
        if (v.temperature)      { p.temperature = v.temperature;    filled.add('temperature'); }
        if (v.respiratoryRate)  { p.respiratoryRate = v.respiratoryRate; filled.add('respiratoryRate'); }
        if (v.oxygenSaturation) { p.oxygenSaturation = v.oxygenSaturation; filled.add('oxygenSaturation'); }
        if (v.weight)           { p.weight = v.weight; filled.add('weight'); }
        if (v.height)           { p.height = v.height; filled.add('height'); }
      }
      if (ai.medications?.length) {
        p.medicines = ai.medications.map(m => ({ name: m.name||'', dose: m.dose||'', frequency: m.frequency||'' }));
        filled.add('medicines');
      }
      setForm(f => ({ ...f, ...p }));
      setAiFields(filled);
    } catch(e) { console.error('emrAutoFill parse error', e); }
  }, []);

  function style_inject() {
    if (document.getElementById('emr-print-css')) return;
    const s = document.createElement('style');
    s.id = 'emr-print-css';
    s.textContent = PRINT_CSS;
    document.head.appendChild(s);
  }

  /* ICD suggestions */
  useEffect(() => {
    const diagText = form.diagnosis.trim();
    if (diagText.length > 2) {
      // Try diagnosis first; if no matches, broaden with chief complaint + symptoms
      let results = suggestICDCodes(diagText, 6);
      if (results.length === 0 && (form.chiefComplaint || form.symptoms)) {
        const combined = [form.chiefComplaint, form.symptoms].filter(Boolean).join(' ');
        results = suggestICDCodes(combined, 6);
      }
      setIcdSuggestions(results);
      if (results.length > 0) setShowIcd(true);
    } else if ((form.chiefComplaint || form.symptoms) && !diagText) {
      // No diagnosis yet — suggest from symptoms
      const combined = [form.chiefComplaint, form.symptoms].filter(Boolean).join(' ');
      const results = suggestICDCodes(combined, 6);
      setIcdSuggestions(results);
      if (results.length > 0) setShowIcd(true);
    } else {
      setIcdSuggestions([]);
      setShowIcd(false);
    }
  }, [form.diagnosis, form.chiefComplaint, form.symptoms]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const ai = k => aiFields.has(k);

  const addMed = () => setForm(f => ({ ...f, medicines: [...f.medicines, { name:'', dose:'', frequency:'' }] }));
  const removeMed = i => setForm(f => ({ ...f, medicines: f.medicines.filter((_,idx) => idx !== i) }));
  const setMed = (i, k) => e => setForm(f => {
    const m = [...f.medicines]; m[i] = { ...m[i], [k]: e.target.value }; return { ...f, medicines: m };
  });

  const handlePatientSummary = async () => {
    const parts = [
      form.chiefComplaint && `Chief complaint: ${form.chiefComplaint}`,
      form.symptoms && `Symptoms: ${form.symptoms}`,
      form.diagnosis && `Diagnosis: ${form.diagnosis}${form.icdCode ? ` (${form.icdCode})` : ''}`,
      form.medicines.filter(m => m.name).map(m => `${m.name} ${m.dose} ${m.frequency}`).join(', ')
        && `Medications: ${form.medicines.filter(m=>m.name).map(m=>`${m.name} ${m.dose} ${m.frequency}`).join(', ')}`,
      form.advice && `Treatment plan: ${form.advice}`,
      form.followUpDate && `Follow-up: ${form.followUpDate}`,
    ].filter(Boolean);
    if (!parts.length) return alert('Please fill in some medical information first.');
    setPatSumLoading(true);
    try {
      const res = await getPatientSummary(parts.join('. '));
      setForm(f => ({ ...f, patientSummary: res.summary }));
    } catch(e) { alert('Patient summary failed: ' + e.message); }
    finally { setPatSumLoading(false); }
  };

  const handleSave = () => {
    localStorage.setItem('emr_draft', JSON.stringify({ form, savedAt: new Date().toISOString() }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveToDB = async () => {
    setDbSaveStatus('saving');
    try {
      const recordId = sessionStorage.getItem('consultRecordId');
      const patientEmail = form.patientContact?.includes('@') ? form.patientContact.trim() : '';

      // ── Also save to localStorage progress tracking ──
      try {
        const vitals = extractVitalsFromEMR({
          bloodPressure: form.bpSystolic && form.bpDiastolic ? `${form.bpSystolic}/${form.bpDiastolic}` : '',
          heartRate: form.heartRate, temperature: form.temperature,
          respiratoryRate: form.respiratoryRate, oxygenSat: form.oxygenSaturation,
          weight: form.weight, height: form.height,
        });
        const result = savePatient({
          patient_id: returningPatient?.id || null,
          name: form.patientName,
          age: form.patientAge,
          gender: form.patientGender,
          blood_group: '',
          contact: form.patientContact,
          diagnosis: form.diagnosis,
          icd_code: form.icdCode,
          vitals,
          medications: form.medicines.filter(m => m.name).map(m => `${m.name} ${m.dose} ${m.frequency}`.trim()),
          doctor_notes: form.advice || form.doctorNotes,
        });
        setProgressToast(result.message);
        setTimeout(() => setProgressToast(''), 4000);
      } catch (localErr) {
        console.warn('Progress localStorage save skipped:', localErr);
      }

      await saveRecord({
        recordId: recordId || undefined,
        patientEmail,
        patientName:  form.patientName,
        patientId:    form.patientId,
        status: 'completed',
        emrData: {
          chiefComplaint: form.chiefComplaint,
          diagnosis:      form.diagnosis,
          symptoms:       form.symptoms ? form.symptoms.split('\n').filter(Boolean) : [],
          vitals: {
            bloodPressure:  form.bpSystolic && form.bpDiastolic ? `${form.bpSystolic}/${form.bpDiastolic} mmHg` : '',
            heartRate:      form.heartRate,
            temperature:    form.temperature,
            respiratoryRate: form.respiratoryRate,
            oxygenSat:      form.oxygenSaturation,
            weight:         form.weight,
            height:         form.height,
          },
          medications: form.medicines.filter(m => m.name).map(m => ({
            name: m.name, dose: m.dose, freq: m.frequency,
          })),
          treatmentPlan: form.advice,
          followUp:      form.followUpDate,
          icdCodes:      form.icdCode ? [{ code: form.icdCode, description: form.diagnosis }] : [],
        },
        patientSummary: form.patientSummary,
      });
      setDbSaveStatus('saved');
      if (patientEmail) sessionStorage.setItem('consultPatientEmail', patientEmail);
    } catch (err) {
      console.error('DB save error:', err);
      setDbSaveStatus('error');
      setTimeout(() => setDbSaveStatus('idle'), 3000);
    }
  };

  const handleLoadDraft = () => {
    const raw = localStorage.getItem('emr_draft');
    if (!raw) return alert('No saved draft found.');
    try { const d = JSON.parse(raw); setForm(d.form); } catch { alert('Could not load draft.'); }
  };

  /* ── Render ── */
  return (
    <div>
      <style>{PRINT_CSS}</style>

      {/* Progress tracking toast */}
      {progressToast && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#1a73e8', color: '#fff', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 700, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.25)', fontSize: '0.9rem' }}>
          📊 {progressToast}
        </div>
      )}

      {/* ── Patient Search Mode ── */}
      {consultMode === 'search' && (
        <div className="no-print" style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800 }}>👤 Find or Register Patient</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Search for a returning patient or register a new one</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '0.9rem' }}>
            <PatientSearch
              onPatientSelected={(patient) => {
                setReturningPatient(patient);
                // Auto-fill the form with the selected patient's details
                setForm(f => ({
                  ...f,
                  patientName:    patient.name    || f.patientName,
                  patientAge:     patient.age     || f.patientAge,
                  patientGender:  patient.gender  || f.patientGender,
                  patientId:      patient.id      || f.patientId,
                  patientContact: patient.contact || f.patientContact,
                }));
                setConsultMode('consult');
              }}
              onNewPatient={() => { setReturningPatient(null); setConsultMode('consult'); }}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { setReturningPatient(null); setConsultMode('consult'); }}
              style={{ background: 'none', border: 'none', color: '#1a73e8', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Skip search — go directly to consultation
            </button>
          </div>
        </div>
      )}

      {/* ── Consultation Mode ── */}
      {consultMode === 'consult' && (
        <>
          {/* Returning / New patient banner */}
          {returningPatient ? (
            <div className="no-print" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '0.9rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: '0.2rem' }}>✅ Returning Patient — {returningPatient.name}</div>
                <div style={{ fontSize: '0.83rem', color: '#374151' }}>
                  <span style={{ marginRight: '1rem' }}>🆔 {returningPatient.id}</span>
                  <span style={{ marginRight: '1rem' }}>📋 {returningPatient.total_visits} previous visit{returningPatient.total_visits !== 1 ? 's' : ''}</span>
                  <span>📅 Last visit: {returningPatient.last_visit}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={`/progress-tracking`} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'none' }}>
                  📊 View Progress
                </a>
                <button onClick={() => { setReturningPatient(null); setConsultMode('search'); }}
                  style={{ background: '#fff', border: '1px solid #93c5fd', borderRadius: 6, padding: '0.4rem 0.8rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', color: '#1d4ed8' }}>
                  🔄 Change Patient
                </button>
              </div>
            </div>
          ) : (
            <div className="no-print" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>🆕 New Patient Registration</div>
              <button onClick={() => setConsultMode('search')}
                style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                ← Search Patient
              </button>
            </div>
          )}

      <div className="page-header no-print">
        <h1>📋 EMR Form</h1>
        <p>AI auto-fills from your recording. Review, edit, then generate the final report.</p>
        {aiFields.size > 0 && (
          <div style={{ marginTop:'0.75rem', padding:'0.6rem 1rem', background:'#d1fae5', color:'#065f46',
                        borderRadius:'var(--radius-sm)', fontSize:'0.85rem', display:'inline-flex', gap:'0.5rem' }}>
            ✓ <strong>{aiFields.size} fields auto-filled</strong> from AI extraction — review and edit before saving.
          </div>
        )}
      </div>

      {/* ─── Toolbar ─── */}
      <div className="no-print" style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
        <button className="btn btn-primary" onClick={() => { setShowPreview(true); setTimeout(() => document.getElementById('emr-preview')?.scrollIntoView({ behavior:'smooth' }), 100); }}>
          📄 Generate EMR Preview
        </button>
        {showPreview && (
          <button className="btn btn-secondary" style={{ background:'#1a73e8', color:'#fff' }} onClick={() => window.print()}>
            🖨 Print / Save PDF
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleSave}>{saved ? '✓ Saved!' : '💾 Save Draft'}</button>
        <button className="btn btn-secondary" onClick={handleLoadDraft}>📂 Load Draft</button>
        <button
          className="btn btn-secondary"
          style={{ background: dbSaveStatus === 'saved' ? '#e8f5e9' : dbSaveStatus === 'error' ? '#ffebee' : '#fff', color: dbSaveStatus === 'saved' ? '#2e7d32' : dbSaveStatus === 'error' ? '#c62828' : 'var(--text-primary)', borderColor: dbSaveStatus === 'saved' ? '#2e7d32' : dbSaveStatus === 'error' ? '#c62828' : 'var(--border)' }}
          onClick={handleSaveToDB}
          disabled={dbSaveStatus === 'saving'}
        >
          {dbSaveStatus === 'saving' ? '⏳ Saving…' : dbSaveStatus === 'saved' ? '✅ Saved to DB' : dbSaveStatus === 'error' ? '❌ Save failed' : '🗄 Save to DB'}
        </button>
        {sourceTranscript && (
          <div style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text-muted)', padding:'0.45rem 0.75rem',
                        background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
            🎤 Filled from: &ldquo;{sourceTranscript.slice(0, 60)}{sourceTranscript.length > 60 ? '…' : ''}&rdquo;
          </div>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

        {/* ─── 1. Patient Details ─── */}
        <div className="card print-section">
          <SH icon="👤" title="1 · Patient Details" />
          <Row2>
            <Field><FL>Patient Name</FL><TI value={form.patientName} onChange={set('patientName')} placeholder="Full name" /></Field>
            <Field><FL>Patient ID</FL><TI value={form.patientId} onChange={set('patientId')} placeholder="e.g. P-20260221-001" /></Field>
          </Row2>
          <Row3>
            <Field><FL>Age</FL><TI value={form.patientAge} onChange={set('patientAge')} placeholder="e.g. 42" /></Field>
            <Field><FL>Gender</FL><TS value={form.patientGender} onChange={set('patientGender')} options={GENDERS} /></Field>
            <Field>
              <FL>Patient Email <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>(links to patient portal)</span></FL>
              <TI value={form.patientContact} onChange={set('patientContact')} placeholder="patient@email.com" />
            </Field>
          </Row3>
        </div>

        {/* ─── 2. Visit Details ─── */}
        <div className="card print-section">
          <SH icon="🏥" title="2 · Visit Details" />
          <Row2>
            <Field><FL>Visit Date</FL><TI type="date" value={form.visitDate} onChange={set('visitDate')} /></Field>
            <Field><FL>Visit Type</FL><TS value={form.visitType} onChange={set('visitType')} options={VISIT_TYPES} /></Field>
          </Row2>
          <Row2>
            <Field><FL>Doctor Name</FL><TI value={form.doctorName} onChange={set('doctorName')} placeholder="Dr. …" /></Field>
            <Field><FL>Department</FL><TS value={form.department} onChange={set('department')} options={DEPARTMENTS} /></Field>
          </Row2>
        </div>

        {/* ─── 3. Medical Information ─── */}
        <div className="card print-section">
          <SH icon="🩺" title="3 · Medical Information" />

          <div style={{ marginBottom:'0.75rem' }}>
            <FL ai={ai('chiefComplaint')}>Chief Complaint</FL>
            <TI value={form.chiefComplaint} onChange={set('chiefComplaint')} placeholder="Main reason for visit" />
          </div>

          <div style={{ marginBottom:'0.75rem' }}>
            <FL ai={ai('symptoms')}>Symptoms (one per line)</FL>
            <TA value={form.symptoms} onChange={set('symptoms')} placeholder={"Headache\nFever\nNausea"} rows={3} />
          </div>

          {/* Vitals */}
          <div style={{ marginBottom:'0.75rem' }}>
            <FL>Vitals</FL>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'0.5rem' }}>
              {[
                ['bpSystolic','BP Sys (mmHg)',ai('bpSystolic')],['bpDiastolic','BP Dia (mmHg)',ai('bpDiastolic')],
                ['heartRate','Heart Rate (bpm)',ai('heartRate')],['temperature','Temperature',ai('temperature')],
                ['respiratoryRate','Resp. Rate',ai('respiratoryRate')],['oxygenSaturation','SpO₂ (%)',ai('oxygenSaturation')],
                ['weight','Weight (kg)',ai('weight')],['height','Height (cm)',ai('height')],
              ].map(([k,lbl,isAi]) => (
                <div key={k}>
                  <FL ai={isAi}>{lbl}</FL>
                  <TI value={form[k]} onChange={set(k)} placeholder="—" />
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <Row2>
            <div>
              <FL ai={ai('diagnosis')}>Diagnosis</FL>
              <TI value={form.diagnosis} onChange={set('diagnosis')} placeholder="Clinical diagnosis" />
            </div>
            <div>
              <FL ai={ai('icdCode')}>
                ICD-10 Code
                {icdSuggestions.length > 0 && (
                  <button className="no-print" onClick={() => setShowIcd(v => !v)}
                    style={{ marginLeft:'0.5rem', background:'var(--primary-light)', color:'var(--primary)',
                             border:'none', borderRadius:99, padding:'0.1rem 0.45rem', fontSize:'0.7rem',
                             fontWeight:600, cursor:'pointer' }}>
                    {showIcd ? 'Hide ▴' : `${icdSuggestions.length} Matches ▾`}
                  </button>
                )}
              </FL>
              <TI value={form.icdCode} onChange={set('icdCode')} placeholder="e.g. G43.909" />
              {showIcd && icdSuggestions.length > 0 && (
                <div className="no-print" style={{ marginTop:'0.35rem', border:'1px solid var(--primary)',
                      borderRadius:'var(--radius-sm)', overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.12)',
                      background:'#fff', zIndex:10, position:'relative' }}>
                  <div style={{ padding:'0.3rem 0.75rem', background:'var(--primary-light)',
                                fontSize:'0.7rem', fontWeight:600, color:'var(--primary)',
                                borderBottom:'1px solid var(--border)' }}>
                    Click to apply — fills both ICD code and diagnosis
                  </div>
                  {icdSuggestions.map((s, i) => (
                    <button key={i}
                      onClick={() => {
                        setForm(f => ({ ...f, icdCode: s.code, diagnosis: s.description }));
                        setShowIcd(false);
                      }}
                      style={{ display:'flex', alignItems:'center', width:'100%', textAlign:'left',
                               padding:'0.5rem 0.75rem', border:'none',
                               borderBottom: i < icdSuggestions.length-1 ? '1px solid var(--border)' : 'none',
                               background:'#fff', cursor:'pointer', fontSize:'0.83rem', gap:'0.75rem',
                               transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <span style={{ fontWeight:700, color:'var(--primary)', minWidth:72, fontFamily:'monospace', fontSize:'0.82rem' }}>{s.code}</span>
                      <span style={{ color:'var(--text-primary)', flex:1 }}>{s.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Row2>
        </div>

        {/* ─── 4. Treatment Plan ─── */}
        <div className="card print-section">
          <SH icon="💊" title="4 · Treatment Plan" />

          {/* Medicines table */}
          <div style={{ marginBottom:'0.75rem' }}>
            <FL ai={ai('medicines')}>Medications</FL>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem', minWidth:480 }}>
                <thead><tr style={{ background:'var(--bg)' }}>
                  {['Medication Name','Dose','Frequency',''].map((h,i) => (
                    <th key={i} style={{ padding:'0.4rem 0.6rem', textAlign:'left', fontWeight:600,
                               borderBottom:'1px solid var(--border)', color:'var(--text-secondary)',
                               width: i===3 ? 40 : 'auto' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {form.medicines.map((m, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'0.3rem 0.5rem' }}>
                        <input value={m.name} onChange={setMed(i,'name')} placeholder="Drug name"
                          style={{ width:'100%', border:'none', outline:'none', fontSize:'0.875rem', fontFamily:'inherit', background:'transparent' }} />
                      </td>
                      <td style={{ padding:'0.3rem 0.5rem' }}>
                        <input value={m.dose} onChange={setMed(i,'dose')} placeholder="e.g. 500mg"
                          style={{ width:'100%', border:'none', outline:'none', fontSize:'0.875rem', fontFamily:'inherit', background:'transparent' }} />
                      </td>
                      <td style={{ padding:'0.3rem 0.5rem' }}>
                        <input value={m.frequency} onChange={setMed(i,'frequency')} placeholder="e.g. Twice daily"
                          style={{ width:'100%', border:'none', outline:'none', fontSize:'0.875rem', fontFamily:'inherit', background:'transparent' }} />
                      </td>
                      <td style={{ padding:'0.3rem 0.5rem', textAlign:'center' }}>
                        <button className="no-print" onClick={() => removeMed(i)}
                          style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:'1rem', lineHeight:1 }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-secondary no-print" style={{ marginTop:'0.5rem', padding:'0.35rem 0.9rem', fontSize:'0.82rem' }} onClick={addMed}>
              + Add Medication
            </button>
          </div>

          <Row2>
            <div>
              <FL>Tests / Investigations Ordered</FL>
              <TA value={form.tests} onChange={set('tests')} placeholder="CBC, HbA1c, X-Ray chest…" rows={2} />
            </div>
            <div>
              <FL ai={ai('followUpDate')}>Follow-up Date</FL>
              <TI type="date" value={form.followUpDate} onChange={set('followUpDate')} />
            </div>
          </Row2>

          <div style={{ marginBottom:'0.75rem' }}>
            <FL ai={ai('advice')}>Advice / Treatment Plan</FL>
            <TA value={form.advice} onChange={set('advice')} placeholder="Patient instructions and plan…" rows={3} />
          </div>
        </div>

        {/* ─── 5. Notes ─── */}
        <div className="card print-section">
          <SH icon="📝" title="5 · Clinical Notes" />

          <div style={{ marginBottom:'0.75rem' }}>
            <FL>Doctor Notes</FL>
            <TA value={form.doctorNotes} onChange={set('doctorNotes')} placeholder="Additional observations, history, examination findings…" rows={3} />
          </div>

          <div style={{ marginBottom:'0.75rem' }}>
            <FL ai={ai('aiSummary')}>AI Clinical Summary</FL>
            <TA value={form.aiSummary} onChange={set('aiSummary')} placeholder="Auto-generated clinical summary from transcript…" rows={3} />
          </div>

          {/* Patient-friendly summary */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
              <FL>Patient-Friendly Summary (Plain Language)</FL>
              <button className="btn btn-secondary no-print" style={{ padding:'0.3rem 0.8rem', fontSize:'0.8rem' }}
                disabled={patSumLoading} onClick={handlePatientSummary}>
                {patSumLoading ? '⚙ Generating…' : '✨ Generate with AI'}
              </button>
            </div>
            <TA value={form.patientSummary} onChange={set('patientSummary')}
              placeholder="Click 'Generate with AI' to create a simple explanation for the patient…" rows={4} />
          </div>
        </div>

        {/* ─── 6. Safety ─── */}
        <div className="card print-section">
          <SH icon="⚠️" title="6 · Safety & Alerts" />
          <Row2>
            <div>
              <FL>Known Allergies</FL>
              <TA value={form.allergies} onChange={set('allergies')} placeholder="Penicillin, Aspirin, Nuts…" rows={2} />
            </div>
            <div>
              <FL>Warnings / Contraindications</FL>
              <TA value={form.warnings} onChange={set('warnings')} placeholder="Drug interactions, cautions…" rows={2} />
            </div>
          </Row2>
        </div>

        {/* ─── EMR Preview ─── */}
        {showPreview && <EMRPreview form={form} />}

      </div>
      </>)}
    </div>
  );
}
