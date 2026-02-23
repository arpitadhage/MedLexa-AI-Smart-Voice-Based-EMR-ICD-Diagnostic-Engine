const express = require('express');
const router = express.Router();

// Mock transcript data (replace with real transcription service integration)
const mockTranscripts = [
  {
    id: '1',
    audioFile: 'audio-sample.wav',
    date: '2026-02-21',
    duration: '3:42',
    text: 'Patient presents with persistent headache for the past three days. Reports pain level 7 out of 10. No fever or nausea. History of migraines. Prescribed ibuprofen 400mg and advised rest.',
    status: 'completed',
  },
];

// GET /api/transcript - List all transcripts
router.get('/', (req, res) => {
  res.json({ transcripts: mockTranscripts });
});

// GET /api/transcript/:id - Get a specific transcript
router.get('/:id', (req, res) => {
  const transcript = mockTranscripts.find((t) => t.id === req.params.id);
  if (!transcript) {
    return res.status(404).json({ error: 'Transcript not found' });
  }
  res.json(transcript);
});

// POST /api/transcript/generate - Trigger transcription for an audio file
router.post('/generate', (req, res) => {
  const { audioFile } = req.body;
  if (!audioFile) {
    return res.status(400).json({ error: 'audioFile is required' });
  }
  // Placeholder: integrate with Whisper / Azure Speech / Google STT
  res.json({
    message: 'Transcription started',
    jobId: 'job-' + Date.now(),
    status: 'processing',
    estimatedTime: '30 seconds',
  });
});

module.exports = router;
