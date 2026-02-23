const express = require('express');
const OpenAI  = require('openai');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const groq = new OpenAI({
  apiKey:  process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/insights
   Body: { diagnosis, visits[] }
   Returns: { summary, improvements[], concerns[], recommendations[] }
──────────────────────────────────────────────────────────────── */
router.post('/insights', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const { diagnosis, visits } = req.body;

    if (!diagnosis || !visits?.length) {
      return res.status(400).json({ error: 'diagnosis and visits are required.' });
    }

    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens:  600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a clinical AI analyzing patient progress. Based on visit history return a JSON with exactly these fields:
{"summary":"2-3 sentence overall progress summary","improvements":["improvement points"],"concerns":["concern points or empty array"],"recommendations":["next visit recommendations"]}.
Return ONLY valid JSON, no markdown, no extra text.`,
        },
        {
          role: 'user',
          content: `Patient diagnosis: ${diagnosis}\nVisit history: ${JSON.stringify(visits)}`,
        },
      ],
    });

    const raw    = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    res.json({ insights: parsed });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate insights.' });
  }
});

module.exports = router;
