import React, { useState, useEffect } from 'react';
import { searchPatients, savePatient } from '../utils/database';

/* ── Small helper ── */
const Badge = ({ children, color = '#1a73e8' }) => (
  <span style={{
    background: color + '18', color, border: `1px solid ${color}44`,
    borderRadius: 99, padding: '0.1rem 0.5rem',
    fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
  }}>{children}</span>
);

export default function PatientSearch({ onPatientSelected, onNewPatient }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', age: '', gender: '', contact: '',
    caretaker_name: '', caretaker_phone: '', caretaker_email: '',
  });
  const [formError, setFormError] = useState('');

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regForm.name.trim()) return setFormError('Patient name is required.');
    if (!regForm.caretaker_name.trim()) return setFormError('Caretaker name is required.');
    if (!regForm.caretaker_phone.trim()) return setFormError('Caretaker phone is required.');
    if (!regForm.caretaker_email.trim()) return setFormError('Caretaker email is required.');
    setFormError('');
    const result = savePatient({
      name: regForm.name,
      age: regForm.age,
      gender: regForm.gender,
      contact: regForm.contact,
      caretaker_name: regForm.caretaker_name,
      caretaker_phone: regForm.caretaker_phone,
      caretaker_email: regForm.caretaker_email,
    });
    onPatientSelected && onPatientSelected(result.patient);
  };

  useEffect(() => {
    if (query.length >= 2) {
      setResults(searchPatients(query));
      setSearched(true);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  return (
    <div style={{ width: '100%' }}>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <span style={{
          position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
          fontSize: '1rem', pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search patient by name, ID or phone..."
          autoFocus
          style={{
            width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem',
            border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit',
            background: '#fff', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Results */}
      {searched && results.length === 0 && !showForm && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
            No patient found for <strong>"{query}"</strong>
          </span>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#2563eb', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            + Register as New Patient
          </button>
        </div>
      )}

      {showForm && (
        <div style={{
          background: '#f8faff', border: '1.5px solid #93c5fd',
          borderRadius: 'var(--radius-sm)', padding: '1.25rem',
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#1d4ed8' }}>
            📋 Register New Patient
          </div>
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Patient Name *</label>
                <input
                  type="text" value={regForm.name} required
                  onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Age</label>
                <input
                  type="text" value={regForm.age}
                  onChange={e => setRegForm(p => ({ ...p, age: e.target.value }))}
                  placeholder="e.g. 34"
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Gender</label>
                <select
                  value={regForm.gender}
                  onChange={e => setRegForm(p => ({ ...p, gender: e.target.value }))}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Contact / Phone</label>
                <input
                  type="text" value={regForm.contact}
                  onChange={e => setRegForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="10-digit number"
                  style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Caretaker section */}
            <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🧑‍⚕️ Caretaker Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Caretaker Name *</label>
                  <input
                    type="text" value={regForm.caretaker_name} required
                    onChange={e => setRegForm(p => ({ ...p, caretaker_name: e.target.value }))}
                    placeholder="Full name of caretaker"
                    style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Caretaker Phone *</label>
                  <input
                    type="tel" value={regForm.caretaker_phone} required
                    onChange={e => setRegForm(p => ({ ...p, caretaker_phone: e.target.value }))}
                    placeholder="10-digit number"
                    style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Caretaker Email *</label>
                  <input
                    type="email" value={regForm.caretaker_email} required
                    onChange={e => setRegForm(p => ({ ...p, caretaker_email: e.target.value }))}
                    placeholder="email@example.com"
                    style={{ width: '100%', padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '0.45rem 0.75rem', fontSize: '0.83rem', color: '#b91c1c', marginBottom: '0.65rem' }}>
                ⚠ {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(''); setRegForm({ name: '', age: '', gender: '', contact: '', caretaker_name: '', caretaker_phone: '', caretaker_email: '' }); }}
                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ✅ Register Patient
              </button>
            </div>
          </form>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {results.map(patient => (
            <div
              key={patient.id}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '0.9rem 1rem', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.75rem', flexWrap: 'wrap',
              }}
            >
              {/* Left: patient info */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{patient.name}</strong>
                  <Badge color="#6366f1">{patient.id}</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {patient.age}y • {patient.gender}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  🏥 {patient.diagnosis || 'No diagnosis recorded'}
                  {patient.icd_code && <span style={{ marginLeft: '0.4rem', color: 'var(--text-muted)' }}>({patient.icd_code})</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>📋 {patient.total_visits} visit{patient.total_visits !== 1 ? 's' : ''}</span>
                  <span>📅 Last: {patient.last_visit}</span>
                </div>
              </div>

              {/* Right: action button */}
              <button
                onClick={() => onPatientSelected && onPatientSelected(patient)}
                style={{
                  background: '#16a34a', color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ✅ Select — Returning Patient
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
