import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractMedicalData, translateTranscript } from '../services/api';

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function TranscriptResult() {
  const location = useLocation();
  const navigate  = useNavigate();
  const state     = location.state || {};

  // Prefer location state; fall back to sessionStorage (when navigating back from step 3)
  const [transcript, setTranscript] = useState(
    state.transcript || sessionStorage.getItem('consultTranscript') || ''
  );
  const isDemo = state.isDemo ?? (sessionStorage.getItem('consultIsDemo') === 'true') ?? false;
  const initTransInfo = state.transInfo || null;

  const [transInfo, setTransInfo]   = useState(initTransInfo);
  const [emrLoading, setEmrLoading] = useState(false);
  const [emrError, setEmrError]     = useState('');
  const [autoStep, setAutoStep]     = useState('');
  const [autoError, setAutoError]   = useState('');

  // If no transcript, send back to record page
  if (!transcript) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <h2 style={{ marginBottom: '0.5rem' }}>No Transcript Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please go back and record or upload audio first.</p>
        <button className="btn btn-primary" onClick={() => navigate('/record-upload')}>
          ← Back to Record &amp; Upload
        </button>
      </div>
    );
  }

  /* ── Extract EMR → navigate to Step 3 page ── */
  const handleExtractEMR = async () => {
    setEmrLoading(true);
    setEmrError('');
    try {
      const res = await extractMedicalData(transcript);
      // Persist for back-navigation from step 3
      sessionStorage.setItem('consultEMR', JSON.stringify(res));
      navigate('/emr-extract-result', {
        state: { emrResult: res, transcript }
      });
    } catch (err) {
      setEmrError(err?.response?.data?.error || err?.message || 'Extraction failed.');
    } finally {
      setEmrLoading(false);
    }
  };

  /* ── One-Click: translate + extract + open EMR form ── */
  const handleAutoFlow = async () => {
    setAutoStep('🌍 Detecting language…');
    setAutoError('');

    let finalTranscript = transcript;

    // Translate if needed
    try {
      const tr = await translateTranscript(transcript);
      if (tr.wasTranslated) {
        finalTranscript = tr.translatedText;
        setTranscript(tr.translatedText);
        setTransInfo({ detectedLanguage: tr.detectedLanguage, wasTranslated: true, originalText: transcript });
      }
    } catch {} // non-fatal

    // Extract
    setAutoStep('🧠 Extracting medical data with AI…');
    try {
      const emr = await extractMedicalData(finalTranscript);
      sessionStorage.setItem('emrAutoFill', JSON.stringify({
        ...emr.data,
        transcript: finalTranscript,
        aiSummary: `Diagnosis: ${emr.data.diagnosis || '—'}. Chief complaint: ${emr.data.chiefComplaint || '—'}.`,
      }));
      setAutoStep('');
      navigate('/emr-form');
    } catch (err) {
      setAutoError(err?.response?.data?.error || err?.message || 'Extraction failed.');
      setAutoStep('');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => navigate('/record-upload')}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0 }}>Transcription &amp; EMR Extraction</h1>
        </div>
        <p>Review the AI-generated transcript, then extract structured medical data or auto-generate a complete EMR form.</p>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'Record / Upload', done: true },
            { n: 2, label: 'Transcribe',      done: true },
            { n: 3, label: 'Extract EMR',     done: false },
            { n: 4, label: 'Fill EMR Form',   done: false },
          ].map(({ n, label, done }, idx, arr) => (
            <React.Fragment key={n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? 'var(--primary)' : (n === 2 ? 'var(--primary)' : 'var(--border)'), color: done || n === 2 ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: '0.82rem', fontWeight: done || n <= 2 ? 600 : 400, color: done || n <= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
              </div>
              {idx < arr.length - 1 && <div style={{ flex: '0 0 2rem', height: 2, background: done || n < 2 ? 'var(--primary)' : 'var(--border)', margin: '0 0.25rem' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>

        {/* ── Left: Transcript ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Transcript Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>📄 Step 2 — Transcript</h2>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {isDemo && <span className="badge badge-warning">Demo</span>}
                <span className="badge badge-success">Transcribed</span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => navigator.clipboard?.writeText(transcript)}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div style={{
              background: 'var(--bg)', padding: '1rem 1.2rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.925rem', lineHeight: 1.8, color: 'var(--text-primary)',
              border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxHeight: 260, overflowY: 'auto'
            }}>
              {transcript}
            </div>

            {isDemo && (
              <div style={{ marginTop: '0.75rem', padding: '0.7rem 1rem', background: '#fff3cd', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#856404' }}>
                <strong>Demo mode:</strong> Set <code>GROQ_API_KEY</code> in <code>backend/.env</code> for live Whisper.
              </div>
            )}

            {transInfo?.wasTranslated && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: '#eff6ff', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#1d4ed8' }}>
                🌐 Detected: <strong>{transInfo.detectedLanguage}</strong> → Translated to English
                <details style={{ marginTop: '0.4rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.78rem' }}>Show original text</summary>
                  <div style={{ marginTop: '0.4rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{transInfo.originalText}</div>
                </details>
              </div>
            )}
          </div>

          {/* Extract Medical Data */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>🏥 Step 3 — Extract Medical Data</h2>
            <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              AI reads the transcript and pulls out chief complaint, symptoms, vitals, diagnosis, medications, and treatment plan.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-success btn-lg"
                  style={{ flex: 1 }}
                  disabled={emrLoading}
                  onClick={handleExtractEMR}
                >
                  {emrLoading ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      Extracting with AI…
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                      Extract Medical Data → Step 3
                    </>
                  )}
              </button>

            </div>
            {emrError && (
              <div style={{ marginTop: '0.6rem', padding: '0.65rem 1rem', background: '#f8d7da', color: '#721c24', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                ✗ {emrError}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: One-Click Pipeline ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* One-Click Pipeline */}
          <div className="card" style={{ border: '2px solid var(--primary)', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--primary)' }}>
              ⚡ One-Click: Full EMR Pipeline
            </h2>
            <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Transcribe → Translate (if needed) → Extract medical data → Open EMR Form, fully pre-filled.
            </p>

            {autoStep && (
              <div style={{ marginBottom: '0.6rem', padding: '0.5rem 0.8rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                {autoStep}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={!!autoStep}
              onClick={handleAutoFlow}
            >
              {autoStep ? '⚙ Processing…' : '⚡ Auto-Generate EMR'}
            </button>

            {autoError && (
              <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: '#fef2f2', color: '#dc2626', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                ✗ {autoError}
              </div>
            )}

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                ✓ Audio transcribed &nbsp;·&nbsp; ✓ Transcript ready &nbsp;·&nbsp; ○ Extraction &amp; form fill pending
              </p>
            </div>
          </div>

          {/* Back card */}
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🎤</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>New Recording?</h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Go back to record or upload a different audio file.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/record-upload')}>
              ← Back to Record &amp; Upload
            </button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
