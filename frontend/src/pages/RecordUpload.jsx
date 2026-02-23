import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcribeAudio } from '../services/api';
import { saveAudio, getAudio, clearAudio } from '../store/audioStore';

/* ─── tiny helpers ─────────────────────────────────────────────────── */
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const STEPS = { idle: 'idle', recording: 'recording', recorded: 'recorded', transcribing: 'transcribing', done: 'done', error: 'error' };

/* ─── Waveform bars ─────────────────────────────────────────────────── */
function Waveform({ active, analyser }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      if (active && analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(data);
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sliceW = W / data.length;
        let x = 0;
        data.forEach((val, i) => {
          const y = (val / 128.0) * (H / 2);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          x += sliceW;
        });
        ctx.lineTo(W, H / 2);
        ctx.stroke();
      } else {
        // flat line when idle
        ctx.strokeStyle = '#e0e4ef';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={72}
      style={{ width: '100%', height: 72, borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border)' }}
    />
  );
}

/* ─── Main component ────────────────────────────────────────────────── */
export default function RecordUpload() {
  const [step, setStep]         = useState(STEPS.idle);
  const [seconds, setSeconds]   = useState(0);
  const [upload, setUpload]     = useState(0);     // 0-100 upload progress
  const [transcript, setTranscript] = useState('');
  const [isDemo, setIsDemo]     = useState(false);
  const [errMsg, setErrMsg]     = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);  // { name, size, blob }
  const navigate = useNavigate();

  const mediaRecRef  = useRef(null);
  const streamRef    = useRef(null);
  const chunksRef    = useRef([]);
  const timerRef     = useRef(null);
  const audioCtxRef  = useRef(null);
  const fileInputRef = useRef(null);

  // Restore audio from store when navigating back from step 2/3
  useEffect(() => {
    const saved = getAudio();
    if (saved) {
      setAudioURL(saved.url);
      setFileInfo({ name: saved.name, size: saved.size, blob: saved.blob });
      setStep(STEPS.recorded);
      // Also restore transcript if available
      const t = sessionStorage.getItem('consultTranscript');
      if (t) { setTranscript(t); setIsDemo(sessionStorage.getItem('consultIsDemo') === 'true'); }
    }
  }, []);

  // cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
  }, []);

  /* ── Recording ── */
  const startRecording = async () => {
    setErrMsg('');
    setTranscript('');
    setAudioURL(null);
    setFileInfo(null);
    chunksRef.current = [];
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio analyser for live waveform
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const src = audioCtx.createMediaStreamSource(stream);
      const an  = audioCtx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      setAnalyser(an);

      // Pick best supported mime
      const preferredMime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
        .find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const mr = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : {});
      mediaRecRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        const ext  = mimeType.includes('ogg') ? '.ogg' : '.webm';
        const name = `recording${ext}`;
        setAudioURL(url);
        setFileInfo({ name, size: blob.size, blob });
        saveAudio(blob, url, name, blob.size);  // persist across navigation
        setStep(STEPS.recorded);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close();
        setAnalyser(null);
      };

      mr.start(250); // collect data every 250 ms
      setStep(STEPS.recording);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      setErrMsg(err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone permission and try again.'
        : `Microphone error: ${err.message}`);
      setStep(STEPS.error);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecRef.current?.stop();
  };

  /* ── File upload input ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioURL(url);
    setFileInfo({ name: file.name, size: file.size, blob: file });
    saveAudio(file, url, file.name, file.size);  // persist across navigation
    setTranscript('');
    sessionStorage.removeItem('consultTranscript');
    setErrMsg('');
    setStep(STEPS.recorded);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('audio/')) {
      setErrMsg('Please drop an audio file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setAudioURL(url);
    setFileInfo({ name: file.name, size: file.size, blob: file });
    saveAudio(file, url, file.name, file.size);  // persist across navigation
    setTranscript('');
    sessionStorage.removeItem('consultTranscript');
    setErrMsg('');
    setStep(STEPS.recorded);
  };

  /* ── Transcribe ── */
  const handleTranscribe = async () => {
    if (!fileInfo?.blob) return;
    setStep(STEPS.transcribing);
    setUpload(0);
    setErrMsg('');
    try {
      const result = await transcribeAudio(
        fileInfo.blob,
        fileInfo.name,
        (pct) => setUpload(pct)
      );
      setTranscript(result.transcript);
      setIsDemo(result.demo ?? false);
      setStep(STEPS.done);
      // Persist for back-navigation and DB saving
      sessionStorage.setItem('consultTranscript', result.transcript);
      sessionStorage.setItem('consultIsDemo', String(result.demo ?? false));
      sessionStorage.removeItem('consultEMR');
      sessionStorage.removeItem('consultRecordId');
      if (result.audio) sessionStorage.setItem('consultAudio', JSON.stringify(result.audio));
      navigate('/transcript-result', {
        state: {
          transcript: result.transcript,
          isDemo: result.demo ?? false,
          audio: result.audio,
        }
      });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Transcription failed.';
      setErrMsg(msg);
      setStep(STEPS.error);
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecRef.current?.state === 'recording' && mediaRecRef.current.stop();
    clearAudio();  // wipe store so back-navigation starts fresh
    sessionStorage.removeItem('consultTranscript');
    sessionStorage.removeItem('consultIsDemo');
    sessionStorage.removeItem('consultEMR');
    sessionStorage.removeItem('consultAudio');
    sessionStorage.removeItem('consultRecordId');
    setStep(STEPS.idle);
    setSeconds(0);
    setTranscript('');
    setAudioURL(null);
    setFileInfo(null);
    setErrMsg('');
    setAnalyser(null);
  };

  const isRecording   = step === STEPS.recording;
  const isTranscribing = step === STEPS.transcribing;
  const hasAudio      = [STEPS.recorded, STEPS.done, STEPS.error].includes(step);

  /* ── Render ── */
  return (
    <div>
      <div className="page-header">
        <h1>Smart Consultation Pipeline</h1>
        <p>Record or upload audio → AI transcribes → AI extracts structured EMR. One click from voice to medical record.</p>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { n: 1, label: 'Record / Upload', done: [STEPS.recorded,STEPS.transcribing,STEPS.done,STEPS.error].includes(step) },
            { n: 2, label: 'Transcribe',      done: step === STEPS.done },
            { n: 3, label: 'Extract EMR',     done: false },
            { n: 4, label: 'Fill EMR Form',   done: false },
          ].map(({ n, label, done }, idx, arr) => (
            <React.Fragment key={n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--border)', color: done ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: '0.82rem', fontWeight: done ? 600 : 400, color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
              </div>
              {idx < arr.length - 1 && <div style={{ flex: '0 0 2rem', height: 2, background: done ? 'var(--primary)' : 'var(--border)', margin: '0 0.25rem' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* ── Left: Controls ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Live recording card */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>🎙 Live Recording</h2>
            <p style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Record directly from your microphone.
            </p>

            <Waveform active={isRecording} analyser={analyser} />

            {isRecording && (
              <div style={{ textAlign: 'center', marginTop: '0.6rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--danger)' }}>
                ● REC {fmt(seconds)}
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              {!isRecording ? (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={startRecording} disabled={isTranscribing}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                  Start Recording
                </button>
              ) : (
                <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }} onClick={stopRecording}>
                  ⏹ Stop — {fmt(seconds)}
                </button>
              )}
              {hasAudio && (
                <button className="btn btn-secondary" onClick={handleReset} disabled={isTranscribing}>
                  ↺ Reset
                </button>
              )}
            </div>
          </div>

        </div>{/* end left column */}

        {/* ── Right: Transcribe + Result ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Transcribe button + progress */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {step === STEPS.idle       && '🎤'}
              {step === STEPS.recording  && '📡'}
              {step === STEPS.recorded   && '✅'}
              {step === STEPS.transcribing && '⚙️'}
              {step === STEPS.done       && '📝'}
              {step === STEPS.error      && '❌'}
            </div>

            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
              {step === STEPS.idle        && 'Ready'}
              {step === STEPS.recording   && 'Recording…'}
              {step === STEPS.recorded    && 'Audio Ready'}
              {step === STEPS.transcribing && 'Transcribing…'}
              {step === STEPS.done        && 'Transcription Complete'}
              {step === STEPS.error       && 'Something went wrong'}
            </div>

            <div style={{ fontSize: '0.855rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {step === STEPS.idle        && 'Record audio to begin.'}
              {step === STEPS.recording   && 'Speak into your microphone.'}
              {step === STEPS.recorded    && 'Click Transcribe to convert to text.'}
              {step === STEPS.transcribing && `Uploading${upload < 100 ? ` (${upload}%)` : ''} — Whisper is processing…`}
              {step === STEPS.done        && (isDemo ? '⚠ Demo mode — add GROQ_API_KEY to backend/.env for real transcription.' : 'Powered by Groq Whisper.')}
              {step === STEPS.error       && errMsg}
            </div>

            {/* Upload progress bar */}
            {isTranscribing && (
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, marginBottom: '1.25rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${upload || 15}%`, background: 'var(--primary)', borderRadius: 999, transition: 'width 0.3s ease' }} />
              </div>
            )}

            {/* Audio preview */}
            {audioURL && (
              <audio controls src={audioURL} style={{ width: '100%', marginBottom: '1rem', borderRadius: 'var(--radius-sm)' }} />
            )}

            <button
              className="btn btn-success btn-lg"
              style={{ width: '100%' }}
              disabled={!hasAudio || isTranscribing || step === STEPS.transcribing}
              onClick={step === STEPS.done || step === STEPS.error ? handleReset : handleTranscribe}
            >
              {isTranscribing ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Transcribing…
                </>
              ) : step === STEPS.done || step === STEPS.error ? (
                '↺ Start Over'
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 2 13 9 20 9" /><polygon points="22 12 2 2 12 22 15 15 22 12" />
                  </svg>
                  Transcribe with Whisper
                </>
              )}
            </button>
            <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
          </div>

        </div>
      </div>
    </div>
  );
}


