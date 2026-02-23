const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { OpenAI } = require('openai');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Groq client — OpenAI-compatible, uses whisper-large-v3
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Determine file extension from MIME type
const mimeToExt = {
  'audio/mpeg':  '.mp3',
  'audio/mp3':   '.mp3',
  'audio/wav':   '.wav',
  'audio/x-wav': '.wav',
  'audio/mp4':   '.mp4',
  'audio/m4a':   '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/webm':  '.webm',
  'audio/ogg':   '.ogg',
  'audio/flac':  '.flac',
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const mime = file.mimetype.split(';')[0].trim();          // strip "; codecs=opus" etc.
    const ext  = mimeToExt[mime] || path.extname(file.originalname) || '.webm';
    cb(null, 'audio-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype.split(';')[0].trim();
    if (mime.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are accepted.'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Helper — delete a file silently
const tryDelete = (filePath) => {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
};

// ─────────────────────────────────────────────
// POST /api/audio/transcribe
// Accepts an audio file, sends it to Whisper, returns { transcript }
// ─────────────────────────────────────────────
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided.' });
  }

  const filePath = req.file.path;

  try {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      // ── DEMO MODE: no real API key supplied ──────────────────────────────
      await new Promise((r) => setTimeout(r, 1500)); // simulate latency
      tryDelete(filePath);
      return res.json({
        transcript:
          '[Demo Mode] Patient presents with persistent headache for the past three days. ' +
          'Reports pain level 7 out of 10. No fever or nausea. History of migraines. ' +
          'Prescribed ibuprofen 400mg and advised rest and hydration.',
        demo: true,
        note: 'Set GROQ_API_KEY in backend/.env for real Whisper transcription via Groq.',
      });  // demo mode — keep the file too (no real audio in demo, but be consistent)
      return res.json({
        transcript:
          '[Demo Mode] Patient presents with persistent headache for the past three days. ' +
          'Reports pain level 7 out of 10. No fever or nausea. History of migraines. ' +
          'Prescribed ibuprofen 400mg and advised rest and hydration.',
        demo: true,
        note: 'Set GROQ_API_KEY in backend/.env for real Whisper transcription via Groq.',
        audio: {
          filename:     req.file.filename,
          originalName: req.file.originalname,
          url:          `/uploads/${req.file.filename}`,
          size:         req.file.size,
        },
      });
    }

    // ── REAL Whisper transcription via Groq ─────────────────────────────
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3',
      response_format: 'json',
    });

    // Keep the file on disk; return URL for storage in DB & session
    return res.json({
      transcript: transcription.text,
      demo: false,
      audio: {
        filename:     req.file.filename,
        originalName: req.file.originalname,
        url:          `/uploads/${req.file.filename}`,
        size:         req.file.size,
      },
    });
  } catch (err) {
    tryDelete(filePath);
    console.error('Whisper error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Transcription failed.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/audio/upload  (plain upload, no transcription)
// ─────────────────────────────────────────────
router.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided.' });
  }
  res.json({
    message: 'Audio uploaded successfully.',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

module.exports = router;
