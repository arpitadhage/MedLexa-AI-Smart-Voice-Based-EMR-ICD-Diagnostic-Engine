import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole]     = useState('doctor');
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '', department: '', patientId: '', caretaker_name: '', caretaker_phone: '', caretaker_email: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  /* ── Name validation ── */
  const nameTrimmed = form.name.trim();
  const nameWords   = nameTrimmed.split(/\s+/).filter(Boolean);
  const nameHasNumbers = /\d/.test(nameTrimmed);
  const nameError =
    touched.name && !nameTrimmed          ? 'Please enter your full name.' :
    touched.name && nameHasNumbers        ? 'Name should not contain numbers.' :
    touched.name && nameWords.length < 2  ? 'Please enter both first and last name.' :
    touched.name && nameTrimmed.length < 4 ? 'Name is too short.' :
    null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Force-touch name so error shows on submit
    setTouched((t) => ({ ...t, name: true }));
    if (!nameTrimmed || nameWords.length < 2 || nameHasNumbers || nameTrimmed.length < 4) {
      return setError('Please enter your full name (first and last name).');
    }
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (role === 'patient') {
      if (!form.caretaker_name.trim()) return setError('Caretaker name is required.');
      if (!form.caretaker_phone.trim()) return setError('Caretaker phone number is required.');
      if (!form.caretaker_email.trim()) return setError('Caretaker email is required.');
    }
    setLoading(true);
    try {
      const user = await register({
        name: nameTrimmed, email: form.email, password: form.password,
        role,
        ...(role === 'doctor'  ? { department: form.department } : {}),
        ...(role === 'patient' ? {
          patientId: form.patientId,
          caretaker_name: form.caretaker_name.trim(),
          caretaker_phone: form.caretaker_phone.trim(),
          caretaker_email: form.caretaker_email.trim(),
        } : {}),
      });
      // Sync caretaker info into emr_patients localStorage so doctors can send alerts
      if (user.role === 'patient') {
        try {
          const existing = JSON.parse(localStorage.getItem('emr_patients') || '[]');
          const idx = existing.findIndex(p => p.name?.toLowerCase() === nameTrimmed.toLowerCase());
          const caretakerData = { caretaker_name: form.caretaker_name.trim(), caretaker_phone: form.caretaker_phone.trim(), caretaker_email: form.caretaker_email.trim() };
          if (idx !== -1) {
            existing[idx] = { ...existing[idx], ...caretakerData };
          } else {
            existing.push({ id: user.patientId || `PT-${Date.now()}`, name: nameTrimmed, age: '', gender: '', contact: '', diagnosis: '', total_visits: 0, first_visit: '', last_visit: '', visits: [], ...caretakerData, created_at: new Date().toISOString() });
          }
          localStorage.setItem('emr_patients', JSON.stringify(existing));
        } catch (_) {}
      }
      navigate(user.role === 'doctor' ? '/record-upload' : '/patient-dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (msg === 'Email already registered.') {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ ...styles.logo, background: role === 'doctor' ? 'var(--primary)' : '#0f9d58' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join Smart EMR as a Doctor or Patient</p>
        </div>

        {/* Role toggle */}
        <div style={styles.roleToggle}>
          {['doctor', 'patient'].map((r) => (
            <button
              key={r} type="button"
              style={{ ...styles.roleBtn, ...(role === r ? { ...styles.roleBtnActive, background: r === 'doctor' ? 'var(--primary)' : '#0f9d58' } : {}) }}
              onClick={() => { setRole(r); setError(''); }}
            >
              {r === 'doctor' ? '🩺' : '🧑‍⚕️'} {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name field with inline validation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {role === 'doctor' ? 'Doctor Full Name' : 'Patient Full Name'}
              <span style={{ color: '#e53935', marginLeft: 2 }}>*</span>
            </label>
            <input
              style={{ padding: '0.7rem 0.9rem', fontSize: '0.925rem', border: `1.5px solid ${nameError ? '#e53935' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg)', fontFamily: 'inherit', color: 'var(--text-primary)' }}
              type="text"
              value={form.name}
              onChange={set('name')}
              onBlur={touch('name')}
              placeholder={role === 'doctor' ? 'e.g. Sarah Ahmed' : 'e.g. Rahul Sharma'}
              required
              autoComplete="name"
            />
            {nameError ? (
              <span style={{ fontSize: '0.78rem', color: '#e53935' }}>✗ {nameError}</span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Enter your real first and last name — this will appear on all records.</span>
            )}
          </div>
          <Field label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />

          {role === 'doctor' && (
            <Field label="Department" type="text" value={form.department} onChange={set('department')} placeholder="e.g. General Medicine, Cardiology" />
          )}
          {role === 'patient' && (
            <>
              <Field label="Patient ID (optional)" type="text" value={form.patientId} onChange={set('patientId')} placeholder="Leave blank to auto-assign" />
              {/* Caretaker section */}
              <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f9d58', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>🧑‍⚕️ Caretaker Details (required)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <Field label="Caretaker Full Name *" type="text" value={form.caretaker_name} onChange={set('caretaker_name')} placeholder="e.g. Priya Shah" required />
                  <Field label="Caretaker Phone Number *" type="tel" value={form.caretaker_phone} onChange={set('caretaker_phone')} placeholder="10-digit mobile number" required />
                  <Field label="Caretaker Email ID *" type="email" value={form.caretaker_email} onChange={set('caretaker_email')} placeholder="caretaker@example.com" required />
                </div>
              </div>
            </>
          )}

          <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required autoComplete="new-password" />
          <Field label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Re-enter password" required autoComplete="new-password" />

          {error && <div style={styles.error}>✗ {error}</div>}

          <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.75 : 1, background: role === 'doctor' ? 'var(--primary)' : '#0f9d58' }}>
            {loading ? 'Creating account…' : `Create ${role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
          </button>
        </form>

        {/* Role info */}
        <div style={styles.infoBox}>
          {role === 'doctor' ? (
            <><strong>Doctor access:</strong> Record audio, transcribe, extract EMR, edit all medical data, generate &amp; print reports.</>
          ) : (
            <><strong>Patient access:</strong> View your own EMR summary, patient-friendly explanation, and follow-up details.</>
          )}
        </div>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
      <input style={{ padding: '0.7rem 0.9rem', fontSize: '0.925rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg)', fontFamily: 'inherit', color: 'var(--text-primary)' }} {...props} />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1.5rem' },
  card: { width: '100%', maxWidth: 440, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '2.5rem 2rem', boxShadow: 'var(--shadow)' },
  header: { textAlign: 'center', marginBottom: '1.25rem' },
  logo: { width: 52, height: 52, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '0.7rem', transition: 'background 0.2s' },
  title: { fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' },
  roleToggle: { display: 'flex', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: '1.25rem' },
  roleBtn: { flex: 1, padding: '0.65rem', fontSize: '0.9rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--bg)', color: 'var(--text-secondary)', transition: 'all 0.2s' },
  roleBtnActive: { color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  error: { padding: '0.65rem 1rem', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' },
  submitBtn: { padding: '0.8rem', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.15rem', transition: 'opacity 0.2s' },
  infoBox: { marginTop: '1rem', padding: '0.7rem 0.9rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 },
  switchText: { textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: 0 },
  link: { color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' },
};
