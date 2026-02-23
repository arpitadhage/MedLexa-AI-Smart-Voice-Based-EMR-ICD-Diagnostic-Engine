import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    title: 'Record / Upload Audio',
    description: 'Capture live patient consultations or upload existing audio recordings for AI-powered transcription.',
    route: '/record-upload',
    btnLabel: 'Start Recording',
    btnClass: 'btn-primary',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'View Transcript',
    description: 'Review auto-generated transcripts from audio recordings. Edit, search, and manage consultation notes.',
    route: '/transcript',
    btnLabel: 'View Transcripts',
    btnClass: 'btn-secondary',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
    title: 'Generate EMR',
    description: 'Automatically structure transcripts into complete Electronic Medical Records with diagnosis and treatment plans.',
    route: '/generate-emr',
    btnLabel: 'Generate EMR',
    btnClass: 'btn-success',
  },
];

const stats = [
  { value: '3x', label: 'Faster Documentation' },
  { value: '98%', label: 'Transcription Accuracy' },
  { value: 'HIPAA', label: 'Compliant Design' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div>
      {/* Hero */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #1a73e8 0%, #1558b0 100%)', border: 'none', color: '#fff', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: '#fff' }}>
          Smart EMR &amp; Diagnostic Assistant
        </h1>
        <p style={{ fontSize: '1.05rem', opacity: 0.88, maxWidth: '560px', margin: '0 auto 1.75rem' }}>
          AI-powered clinical documentation — record consultations, auto-generate transcripts, and produce structured Electronic Medical Records in seconds.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-lg" style={{ background: '#fff', color: '#1a73e8' }} onClick={() => navigate('/record-upload')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Get Started
          </button>
          <button className="btn btn-lg" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.6)' }} onClick={() => navigate('/generate-emr')}>
            View Demo EMR
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{s.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>What would you like to do?</h2>
      <div className="grid grid-3">
        {features.map((f) => (
          <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              {f.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.description}</p>
            </div>
            <button className={`btn ${f.btnClass}`} onClick={() => navigate(f.route)} style={{ marginTop: 'auto' }}>
              {f.btnLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
