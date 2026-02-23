const express    = require('express');
const EMRRecord  = require('../models/EMRRecord');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   POST /api/records
   Create / upsert an EMR record for this consultation.
   Body: { patientEmail, patientName, patientId, transcript,
           isDemo, audio, emrData, patientSummary, status }
   The `audio` field is what the transcribe endpoint returns:
   { filename, originalName, url, size }
──────────────────────────────────────────────────────────────── */
router.post('/', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const {
      patientEmail, patientName, patientId,
      transcript, isDemo,
      audio,
      emrData, patientSummary,
      status,
      recordId,         // if updating existing record
    } = req.body;

    // doctorId always comes from JWT — no extra check needed

    let record;
    if (recordId) {
      // Update existing record
      record = await EMRRecord.findByIdAndUpdate(
        recordId,
        {
          $set: {
            ...(transcript    !== undefined && { transcript }),
            ...(audio         !== undefined && { audio }),
            ...(emrData       !== undefined && { emrData }),
            ...(patientSummary!== undefined && { patientSummary }),
            ...(status        !== undefined && { status }),
          }
        },
        { new: true }
      );
      if (!record) return res.status(404).json({ error: 'Record not found.' });
    } else {
      // Create new record
      record = await EMRRecord.create({
        patientEmail: patientEmail.toLowerCase(),
        patientName,
        patientId,
        doctorId:   req.user.id,
        doctorName: req.user.name,
        transcript,
        isDemo:  isDemo || false,
        audio,
        emrData,
        patientSummary,
        status: status || 'transcribed',
      });
    }

    res.status(201).json({ record });
  } catch (err) {
    console.error('Save record error:', err);
    res.status(500).json({ error: 'Failed to save record.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/records/my
   Doctor: all records they created (sorted newest first)
   Patient: all records for their email
──────────────────────────────────────────────────────────────── */
router.get('/my', requireAuth, async (req, res) => {
  try {
    let records;
    if (req.user.role === 'doctor') {
      records = await EMRRecord.find({ doctorId: req.user.id })
        .sort({ createdAt: -1 })
        .select('-emrData.rawText'); // trim payload
    } else {
      // patient — match by email
      records = await EMRRecord.find({ patientEmail: req.user.email })
        .sort({ createdAt: -1 })
        .select('-emrData.rawText');
    }
    res.json({ records });
  } catch (err) {
    console.error('Fetch records error:', err);
    res.status(500).json({ error: 'Failed to fetch records.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/records/:id
   Get full detail of a single record
──────────────────────────────────────────────────────────────── */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const record = await EMRRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found.' });

    // Patients can only see their own records
    if (req.user.role === 'patient' && record.patientEmail !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ record });
  } catch (err) {
    console.error('Fetch record error:', err);
    res.status(500).json({ error: 'Failed to fetch record.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/records/:id  (doctor only)
──────────────────────────────────────────────────────────────── */
router.delete('/:id', requireAuth, requireRole('doctor'), async (req, res) => {
  try {
    const record = await EMRRecord.findOneAndDelete({
      _id: req.params.id,
      doctorId: req.user.id,
    });
    if (!record) return res.status(404).json({ error: 'Record not found or not yours.' });
    res.json({ message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

module.exports = router;
