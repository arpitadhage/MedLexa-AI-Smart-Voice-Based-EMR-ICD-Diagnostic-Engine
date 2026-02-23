const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

// Groq client (same key as audio transcription)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const SYSTEM_PROMPT = `You are a medical data extraction assistant. 
Given a clinical consultation transcript, extract the following fields and return ONLY valid JSON — no explanation, no markdown, no code fences.

JSON shape (use null for any field not mentioned):
{
  "chiefComplaint": "string",
  "symptoms": ["string"],
  "vitals": {
    "bloodPressure": "string or null",
    "heartRate": "string or null",
    "temperature": "string or null",
    "respiratoryRate": "string or null",
    "oxygenSaturation": "string or null",
    "weight": "string or null",
    "height": "string or null"
  },
  "diagnosis": "string",
  "icdCode": "string or null",
  "medications": [
    { "name": "string", "dose": "string", "frequency": "string" }
  ],
  "plan": ["string"],
  "followUp": "string or null"
}`;

const DEMO_RESPONSE = {
  chiefComplaint: 'Persistent headache for 3 days',
  symptoms: ['Headache', 'Pain level 7/10', 'No fever', 'No nausea'],
  vitals: { bloodPressure: null, heartRate: null, temperature: null, respiratoryRate: null, oxygenSaturation: null, weight: null, height: null },
  diagnosis: 'Migraine headache, unspecified',
  icdCode: 'G43.909',
  medications: [{ name: 'Ibuprofen', dose: '400mg', frequency: 'Every 6 hours as needed' }],
  plan: ['Prescribe Ibuprofen 400mg every 6 hours PRN', 'Advise rest and adequate hydration', 'Follow-up in 1 week if symptoms persist'],
  followUp: '1 week if symptoms persist',
};

// GET /api/emr - List all EMR records
router.get('/', (req, res) => {
  res.json({ records: [] });
});

// POST /api/emr/patient-summary — convert clinical text → patient-friendly language
router.post('/patient-summary', async (req, res) => {
  const { clinicalText } = req.body;
  if (!clinicalText?.trim()) return res.status(400).json({ error: 'clinicalText is required' });

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    await new Promise((r) => setTimeout(r, 800));
    return res.json({
      summary: 'You came in because of a headache that has been bothering you for 3 days. The doctor diagnosed you with a migraine — a type of severe headache that some people get regularly. You have been given a painkiller called Ibuprofen (400 mg) to take every 6 hours when needed. Please rest, drink plenty of water, and come back in 1 week if the headache does not improve.',
      demo: true,
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a compassionate medical communicator. Rewrite the given clinical summary in simple, friendly, non-technical English that a patient with no medical background can easily understand. Use short sentences. Avoid medical jargon. Reassure the patient where appropriate. Output plain text only — no markdown.',
        },
        { role: 'user', content: clinicalText.trim() },
      ],
      temperature: 0.4,
      max_tokens: 512,
    });
    const summary = completion.choices[0]?.message?.content?.trim() || '';
    return res.json({ summary, demo: false });
  } catch (err) {
    console.error('patient-summary error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Failed to generate patient summary.' });
  }
});

// POST /api/emr/translate — detect language, translate to English if needed
router.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    await new Promise((r) => setTimeout(r, 600));
    return res.json({ translatedText: text, detectedLanguage: 'English', wasTranslated: false, demo: true });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a multilingual medical translator. Detect the language of the input text. If it is English, return it unchanged. If it is any other language (e.g. Hindi, Spanish, Arabic, French), translate it to English. Return ONLY valid JSON with this shape: { "detectedLanguage": "string", "translatedText": "string", "wasTranslated": boolean }. No markdown, no explanation.',
        },
        { role: 'user', content: text.trim() },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(raw);
    return res.json({ ...result, demo: false });
  } catch (err) {
    console.error('translate error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Translation failed.' });
  }
});

// POST /api/emr/extract - Use Groq LLM to extract structured data from transcript
router.post('/extract', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'transcript is required' });
  }

  // Demo mode
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    await new Promise((r) => setTimeout(r, 1200));
    return res.json({ data: DEMO_RESPONSE, demo: true });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transcript:\n${transcript.trim()}` },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'LLM returned invalid JSON', raw });
    }

    return res.json({ data, demo: false });
  } catch (err) {
    console.error('Groq LLM error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'LLM extraction failed.' });
  }
});

// POST /api/emr/generate - kept for backward compat
router.post('/generate', async (req, res) => {
  const { transcriptText } = req.body;
  if (!transcriptText) return res.status(400).json({ error: 'transcriptText is required' });
  // Delegate to /extract logic inline
  req.body.transcript = transcriptText;
  return router.handle({ ...req, url: '/extract', method: 'POST' }, res, () => {});
});

// GET /api/emr/:id
router.get('/:id', (req, res) => {
  res.status(404).json({ error: 'EMR record not found' });
});

module.exports = router;
