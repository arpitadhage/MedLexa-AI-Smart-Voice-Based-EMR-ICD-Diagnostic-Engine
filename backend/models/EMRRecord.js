const mongoose = require('mongoose');

const emrRecordSchema = new mongoose.Schema({
  // Who owns this record
  patientEmail: { type: String, default: '', lowercase: true },
  patientName:  { type: String },
  patientId:    { type: String },

  // Who created it
  doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String },

  // Audio file (saved on disk, served as static)
  audio: {
    filename:     String,
    originalName: String,
    url:          String,   // e.g. /uploads/audio-123456.webm
    size:         Number,
  },

  // Transcript
  transcript: { type: String },
  isDemo:     { type: Boolean, default: false },

  // Structured EMR extracted by AI
  emrData: {
    chiefComplaint: String,
    diagnosis:      String,
    symptoms:       [String],
    vitals: {
      bloodPressure:  String,
      heartRate:      String,
      temperature:    String,
      oxygenSat:      String,
      weight:         String,
      height:         String,
    },
    medications: [{
      name:   String,
      dose:   String,
      route:  String,
      freq:   String,
      duration: String,
    }],
    treatmentPlan: String,
    followUp:      String,
    icdCodes: [{
      code:        String,
      description: String,
    }],
    rawText: String,
  },

  // Patient-friendly summary (generated separately)
  patientSummary: String,

  // Workflow status
  status: {
    type: String,
    enum: ['transcribed', 'extracted', 'completed'],
    default: 'transcribed',
  },
}, { timestamps: true });

// Index for quick lookups
emrRecordSchema.index({ patientEmail: 1, createdAt: -1 });
emrRecordSchema.index({ doctorId: 1,    createdAt: -1 });

module.exports = mongoose.model('EMRRecord', emrRecordSchema);
