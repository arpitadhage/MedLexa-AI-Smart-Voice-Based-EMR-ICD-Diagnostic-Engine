import React, { useState } from 'react';

const SAMPLE_TRANSCRIPTS = [
  {
    id: '1',
    title: 'Consultation — Feb 21, 2026',
    audioFile: 'audio-001.wav',
    duration: '3:42',
    date: '2026-02-21',
    status: 'completed',
    text: 'Patient presents with persistent headache for the past three days. Reports pain level 7 out of 10. No fever or nausea. History of migraines. Prescribed ibuprofen 400mg and advised rest.',
  },
  {
    id: '2',
    title: 'Follow-up — Feb 18, 2026',
    audioFile: 'audio-002.mp3',
    duration: '5:15',
    date: '2026-02-18',
    status: 'completed',
    text: 'Follow-up for hypertension management. Blood pressure reading 138/88 mmHg. Patient reports compliance with medication. Continue lisinopril 10mg once daily. Lifestyle modifications reinforced.',
  },
  {
    id: '3',
    title: 'New Recording',
    audioFile: 'audio-003.webm',
    duration: '1:08',
    date: '2026-02-21',
    status: 'processing',
    text: '',
  },
];

export default function Transcript() {
  const [selected, setSelected] = useState(SAMPLE_TRANSCRIPTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editText, setEditText] = useState(null);

  const filtered = SAMPLE_TRANSCRIPTS.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>View Transcript</h1>
        <p>Review and edit auto-generated consultation transcripts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Sidebar list */}
        <div className="card" style={{ padding: '1rem' }}>
          <input
            type="search"
            placeholder="Search transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', outline: 'none', marginBottom: '0.75rem', background: 'var(--bg)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => { setSelected(t); setEditText(null); }}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selected?.id === t.id ? 'var(--primary-light)' : 'var(--bg)', border: `1px solid ${selected?.id === t.id ? 'var(--primary)' : 'var(--border)'}`, transition: 'background var(--transition)' }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem', color: selected?.id === t.id ? 'var(--primary)' : 'var(--text-primary)' }}>{t.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.date} · {t.duration}</span>
                  <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem' }}>
                No transcripts found
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card">
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selected.title}</h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {selected.audioFile} · {selected.duration} · {selected.date}
                  </div>
                </div>
                <span className={`badge ${selected.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {selected.status}
                </span>
              </div>

              {selected.status === 'processing' ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <div>Transcription in progress…</div>
                </div>
              ) : editText !== null ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ width: '100%', minHeight: 180, padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', fontSize: '0.9rem', lineHeight: 1.7, resize: 'vertical', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-success" onClick={() => setEditText(null)}>Save Changes</button>
                    <button className="btn btn-secondary" onClick={() => setEditText(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--bg)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.925rem', lineHeight: 1.8, color: 'var(--text-primary)', minHeight: 120, marginBottom: '1rem', border: '1px solid var(--border)' }}>
                    {selected.text || <span style={{ color: 'var(--text-muted)' }}>No transcript text available.</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setEditText(selected.text)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(selected.text)}>
                      📋 Copy
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Select a transcript to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
