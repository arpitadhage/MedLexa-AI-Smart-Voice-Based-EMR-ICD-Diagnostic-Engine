import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// Forward the JWT from axios defaults (set by AuthContext) to every api call
api.interceptors.request.use((config) => {
  const auth = axios.defaults.headers.common['Authorization'];
  if (auth) config.headers['Authorization'] = auth;
  return config;
});

/**
 * Send an audio Blob or File to the backend for Whisper transcription.
 */
export async function transcribeAudio(audioData, filename = 'recording.webm', onProgress) {
  const formData = new FormData();
  formData.append('audio', audioData, filename);

  const { data } = await api.post('/audio/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (evt) => { if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100)); }
      : undefined,
  });
  return data;
}

/**
 * Use Groq LLM to extract structured medical data from a transcript.
 * Returns: { chiefComplaint, symptoms, vitals, diagnosis, icdCode, medications, plan, followUp }
 */
export async function extractMedicalData(transcript) {
  const { data } = await api.post('/emr/extract', { transcript });
  return data; // { data: {...}, demo: bool }
}

/**
 * Convert clinical text into patient-friendly plain language.
 */
export async function getPatientSummary(clinicalText) {
  const { data } = await api.post('/emr/patient-summary', { clinicalText });
  return data; // { summary, demo }
}

/**
 * Detect language of text and translate to English if needed.
 */
export async function translateTranscript(text) {
  const { data } = await api.post('/emr/translate', { text });
  return data; // { detectedLanguage, translatedText, wasTranslated, demo }
}

/* ───────────────────────────────────────────────────────────────────
   Records (MongoDB)
──────────────────────────────────────────────────────────────────── */

/**
 * Create or update an EMR record in the database.
 */
export async function saveRecord(payload) {
  const { data } = await api.post('/records', payload);
  return data; // { record }
}

/**
 * Fetch all records for the current user (doctor → their records, patient → their records).
 */
export async function getMyRecords() {
  const { data } = await api.get('/records/my');
  return data; // { records }
}

/**
 * Fetch a single full record by ID.
 */
export async function getRecord(id) {
  const { data } = await api.get(`/records/${id}`);
  return data; // { record }
}

/**
 * Delete a record (doctor only).
 */
export async function deleteRecord(id) {
  const { data } = await api.delete(`/records/${id}`);
  return data;
}

export default api;
