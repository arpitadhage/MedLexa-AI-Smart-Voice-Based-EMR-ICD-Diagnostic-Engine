import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = { doctor: '#1a73e8', patient: '#0f9d58' };
const ROLE_ICONS  = { doctor: '🩺', patient: '🧑‍⚕️' };

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'doctor' ? '/record-upload' : '/patient-dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setForm({ email: `${role}@smartemr.com`, password: `${role}123` });
    setError('');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 style={styles.title}>Smart EMR</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Demo quick-fill */}
        <div style={styles.demoRow}>
          <span style={styles.demoLabel}>Demo accounts:</span>
          {['doctor', 'patient'].map((r) => (
            <button key={r} type="button" style={{ ...styles.demoBtn, borderColor: ROLE_COLORS[r], color: ROLE_COLORS[r] }} onClick={() => fillDemo(r)}>
              {ROLE_ICONS[r]} {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required autoComplete="current-password" />
          </div>

          {error && <div style={styles.error}>✗ {error}</div>}

          <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.75 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1.5rem' },
  card: { width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '2.5rem 2rem', boxShadow: 'var(--shadow)' },
  header: { textAlign: 'center', marginBottom: '1.5rem' },
  logo: { width: 52, height: 52, background: 'var(--primary)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' },
  demoRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  demoLabel: { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' },
  demoBtn: { padding: '0.25rem 0.65rem', fontSize: '0.78rem', fontWeight: 600, borderRadius: 999, background: 'transparent', border: '1.5px solid', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' },
  input: { padding: '0.7rem 0.9rem', fontSize: '0.925rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg)', fontFamily: 'inherit', transition: 'border-color 0.15s', color: 'var(--text-primary)' },
  error: { padding: '0.65rem 1rem', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' },
  submitBtn: { padding: '0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.25rem' },
  switchText: { textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.25rem', marginBottom: 0 },
  link: { color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' },
};
