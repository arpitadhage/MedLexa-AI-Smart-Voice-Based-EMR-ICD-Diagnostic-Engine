// ───────────────────────────────────────────────────────────────────────
//  Smart EMR — Patient Progress Database (localStorage)
// ───────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'emr_patients';

/* ── Helpers ── */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(patients) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.error('localStorage write error:', e);
  }
}

/* ── 1. generatePatientId ── */
export function generatePatientId(name = '', age = '', gender = '') {
  const nameCode = (name || 'UNK').replace(/\s+/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  const genderInitial = (gender || 'U')[0].toUpperCase();
  const hash = Math.floor(1000 + Math.random() * 9000);
  return `${nameCode}-${age}-${genderInitial}-${hash}`;
}

/* ── 2. savePatient ── */
export function savePatient(patientData) {
  const {
    patient_id, name, age, gender, blood_group,
    contact, diagnosis, icd_code, vitals,
    medications, doctor_notes,
    caretaker_name, caretaker_phone, caretaker_email,
  } = patientData;

  const patients = readAll();

  const visitData = {
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timestamp: new Date().toISOString(),
    ...(vitals || {}),
    medications: medications || [],
    notes: doctor_notes || '',
    diagnosis: diagnosis || '',
    icd_code: icd_code || '',
  };

  // Returning patient — find by id
  if (patient_id) {
    const idx = patients.findIndex(p => p.id === patient_id);
    if (idx !== -1) {
      const patient = patients[idx];
      const visit_number = (patient.total_visits || patient.visits.length) + 1;
      visitData.visit_number = visit_number;
      patient.visits.push(visitData);
      patient.total_visits = visit_number;
      patient.last_visit = visitData.date;
      patient.diagnosis = diagnosis || patient.diagnosis;
      patient.icd_code = icd_code || patient.icd_code;
      patients[idx] = patient;
      writeAll(patients);
      return { isNew: false, patient, visit_number, message: `Visit ${visit_number} recorded for ${patient.name}` };
    }
  }

  // New patient
  const newId = generatePatientId(name, age, gender);
  visitData.visit_number = 1;
  const newPatient = {
    id: newId,
    name: name || 'Unknown',
    age: age || '',
    gender: gender || '',
    blood_group: blood_group || '',
    contact: contact || '',
    diagnosis: diagnosis || '',
    icd_code: icd_code || '',
    caretaker_name: caretaker_name || '',
    caretaker_phone: caretaker_phone || '',
    caretaker_email: caretaker_email || '',
    total_visits: 1,
    first_visit: visitData.date,
    last_visit: visitData.date,
    created_at: new Date().toISOString(),
    visits: [visitData],
  };
  patients.push(newPatient);
  writeAll(patients);
  return { isNew: true, patient: newPatient, visit_number: 1, message: `New patient ${name} registered — ID: ${newId}` };
}

/* ── 3. getAllPatients ── */
export function getAllPatients() {
  return readAll();
}

/* ── 4. getPatientById ── */
export function getPatientById(id) {
  return readAll().find(p => p.id === id) || null;
}

/* ── 5. deletePatient ── */
export function deletePatient(id) {
  const patients = readAll().filter(p => p.id !== id);
  writeAll(patients);
}

/* ── 6. searchPatients ── */
export function searchPatients(query = '') {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return readAll().filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.id || '').toLowerCase().includes(q) ||
    (p.contact || '').toLowerCase().includes(q)
  );
}

/* ── 7. seedDummyDataIfEmpty ── */
export function seedDummyDataIfEmpty() {
  const existing = readAll();
  if (existing.length > 0) return; // never overwrite real data

  const makeDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const makeISO = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  const patients = [
    // ── Patient 1: Sarah Johnson — Type 2 Diabetes ──
    {
      id: 'SAR-58-F-4821',
      name: 'Sarah Johnson',
      age: '58',
      gender: 'Female',
      blood_group: 'O+',
      contact: '9876543210',
      diagnosis: 'Type 2 Diabetes',
      icd_code: 'E11',
      total_visits: 5,
      first_visit: makeDate(120),
      last_visit: makeDate(5),
      created_at: makeISO(120),
      visits: [
        { visit_number: 1, date: makeDate(120), timestamp: makeISO(120), glucose: 340, hba1c: 10.2, bp_systolic: 138, bp_diastolic: 88, weight: 72, heart_rate: 84, diagnosis: 'Type 2 Diabetes', icd_code: 'E11', medications: ['Metformin 500mg', 'Glipizide 5mg'], notes: 'Initial diagnosis. High glucose, starting therapy.' },
        { visit_number: 2, date: makeDate(90), timestamp: makeISO(90), glucose: 290, hba1c: 9.8, bp_systolic: 134, bp_diastolic: 86, weight: 71.2, heart_rate: 82, diagnosis: 'Type 2 Diabetes', icd_code: 'E11', medications: ['Metformin 500mg', 'Glipizide 5mg'], notes: 'Some improvement. Continue current meds.' },
        { visit_number: 3, date: makeDate(60), timestamp: makeISO(60), glucose: 210, hba1c: 8.5, bp_systolic: 130, bp_diastolic: 84, weight: 70.5, heart_rate: 80, diagnosis: 'Type 2 Diabetes', icd_code: 'E11', medications: ['Metformin 1000mg', 'Glipizide 5mg'], notes: 'Good progress. Increased Metformin dose.' },
        { visit_number: 4, date: makeDate(30), timestamp: makeISO(30), glucose: 165, hba1c: 7.4, bp_systolic: 128, bp_diastolic: 82, weight: 69.8, heart_rate: 78, diagnosis: 'Type 2 Diabetes', icd_code: 'E11', medications: ['Metformin 1000mg', 'Glipizide 5mg'], notes: 'Near target. Diet compliance improving.' },
        { visit_number: 5, date: makeDate(5), timestamp: makeISO(5), glucose: 128, hba1c: 6.8, bp_systolic: 124, bp_diastolic: 80, weight: 69.1, heart_rate: 76, diagnosis: 'Type 2 Diabetes', icd_code: 'E11', medications: ['Metformin 1000mg'], notes: 'Excellent control. Stopped Glipizide. Maintain lifestyle.' },
      ],
    },
    // ── Patient 2: Robert Smith — Hypertension ──
    {
      id: 'ROB-52-M-3742',
      name: 'Robert Smith',
      age: '52',
      gender: 'Male',
      blood_group: 'A+',
      contact: '9823456781',
      diagnosis: 'Hypertension',
      icd_code: 'I10',
      total_visits: 5,
      first_visit: makeDate(100),
      last_visit: makeDate(7),
      created_at: makeISO(100),
      visits: [
        { visit_number: 1, date: makeDate(100), timestamp: makeISO(100), bp_systolic: 172, bp_diastolic: 104, heart_rate: 96, weight: 88, diagnosis: 'Hypertension', icd_code: 'I10', medications: ['Amlodipine 5mg'], notes: 'Stage 2 hypertension. Started Amlodipine.' },
        { visit_number: 2, date: makeDate(75), timestamp: makeISO(75), bp_systolic: 158, bp_diastolic: 98, heart_rate: 92, weight: 87.5, diagnosis: 'Hypertension', icd_code: 'I10', medications: ['Amlodipine 5mg'], notes: 'Moderate improvement. Continue.' },
        { visit_number: 3, date: makeDate(50), timestamp: makeISO(50), bp_systolic: 148, bp_diastolic: 94, heart_rate: 88, weight: 87, diagnosis: 'Hypertension', icd_code: 'I10', medications: ['Amlodipine 5mg', 'Telmisartan 40mg'], notes: 'Added Telmisartan for better control.' },
        { visit_number: 4, date: makeDate(25), timestamp: makeISO(25), bp_systolic: 134, bp_diastolic: 86, heart_rate: 84, weight: 86.2, diagnosis: 'Hypertension', icd_code: 'I10', medications: ['Amlodipine 5mg', 'Telmisartan 40mg'], notes: 'Good control. Patient reducing salt intake.' },
        { visit_number: 5, date: makeDate(7), timestamp: makeISO(7), bp_systolic: 122, bp_diastolic: 80, heart_rate: 80, weight: 85.5, diagnosis: 'Hypertension', icd_code: 'I10', medications: ['Amlodipine 5mg', 'Telmisartan 40mg'], notes: 'Near normal BP. Excellent response to dual therapy.' },
      ],
    },
    // ── Patient 3: James Wilson — AMI ──
    {
      id: 'JAM-45-M-6193',
      name: 'James Wilson',
      age: '45',
      gender: 'Male',
      blood_group: 'B+',
      contact: '9112233445',
      diagnosis: 'Acute Myocardial Infarction',
      icd_code: 'I21.9',
      total_visits: 5,
      first_visit: makeDate(90),
      last_visit: makeDate(10),
      created_at: makeISO(90),
      visits: [
        { visit_number: 1, date: makeDate(90), timestamp: makeISO(90), bp_systolic: 158, bp_diastolic: 92, heart_rate: 102, spo2: 94, weight: 80, diagnosis: 'Acute Myocardial Infarction', icd_code: 'I21.9', medications: ['Aspirin 300mg', 'Clopidogrel 75mg', 'Atorvastatin 80mg'], notes: 'STEMI presented to ER. PCI done. Started DAPT.' },
        { visit_number: 2, date: makeDate(65), timestamp: makeISO(65), bp_systolic: 140, bp_diastolic: 86, heart_rate: 88, spo2: 96, weight: 79.5, diagnosis: 'Acute Myocardial Infarction', icd_code: 'I21.9', medications: ['Aspirin 75mg', 'Clopidogrel 75mg', 'Atorvastatin 80mg'], notes: 'Stable. Aspirin dose reduced. Echo: EF 45%.' },
        { visit_number: 3, date: makeDate(45), timestamp: makeISO(45), bp_systolic: 132, bp_diastolic: 82, heart_rate: 82, spo2: 97, weight: 79, diagnosis: 'Acute Myocardial Infarction', icd_code: 'I21.9', medications: ['Aspirin 75mg', 'Clopidogrel 75mg', 'Atorvastatin 80mg', 'Metoprolol 25mg'], notes: 'Added Metoprolol for rate control.' },
        { visit_number: 4, date: makeDate(25), timestamp: makeISO(25), bp_systolic: 126, bp_diastolic: 78, heart_rate: 76, spo2: 98, weight: 78.5, diagnosis: 'Acute Myocardial Infarction', icd_code: 'I21.9', medications: ['Aspirin 75mg', 'Clopidogrel 75mg', 'Atorvastatin 80mg', 'Metoprolol 25mg'], notes: 'Echo improving EF 52%.' },
        { visit_number: 5, date: makeDate(10), timestamp: makeISO(10), bp_systolic: 118, bp_diastolic: 74, heart_rate: 72, spo2: 99, weight: 78, diagnosis: 'Acute Myocardial Infarction', icd_code: 'I21.9', medications: ['Aspirin 75mg', 'Clopidogrel 75mg', 'Atorvastatin 80mg', 'Metoprolol 25mg'], notes: 'Excellent recovery. EF 58%. Continue meds.' },
      ],
    },
    // ── Patient 4: Priya Sharma — MDD ──
    {
      id: 'PRI-32-F-7834',
      name: 'Priya Sharma',
      age: '32',
      gender: 'Female',
      blood_group: 'AB+',
      contact: '9988776655',
      diagnosis: 'Major Depressive Disorder',
      icd_code: 'F32.1',
      total_visits: 5,
      first_visit: makeDate(110),
      last_visit: makeDate(12),
      created_at: makeISO(110),
      visits: [
        { visit_number: 1, date: makeDate(110), timestamp: makeISO(110), phq9_score: 18, gad7_score: 12, weight: 52, sleep_hours: 4, diagnosis: 'Major Depressive Disorder', icd_code: 'F32.1', medications: ['Escitalopram 10mg', 'Clonazepam 0.5mg'], notes: 'Severe depression. Patient unable to function. Started SSRI.' },
        { visit_number: 2, date: makeDate(80), timestamp: makeISO(80), phq9_score: 15, gad7_score: 10, weight: 52.5, sleep_hours: 5.5, diagnosis: 'Major Depressive Disorder', icd_code: 'F32.1', medications: ['Escitalopram 10mg', 'Clonazepam 0.5mg'], notes: 'Partial response. Sleep improving slightly.' },
        { visit_number: 3, date: makeDate(55), timestamp: makeISO(55), phq9_score: 11, gad7_score: 8, weight: 53, sleep_hours: 6.5, diagnosis: 'Major Depressive Disorder', icd_code: 'F32.1', medications: ['Escitalopram 20mg', 'Clonazepam 0.25mg'], notes: 'Increased Escitalopram. Reduced Clonazepam.' },
        { visit_number: 4, date: makeDate(30), timestamp: makeISO(30), phq9_score: 7, gad7_score: 5, weight: 53.8, sleep_hours: 7, diagnosis: 'Major Depressive Disorder', icd_code: 'F32.1', medications: ['Escitalopram 20mg'], notes: 'Good response. Stopped Clonazepam. Therapy ongoing.' },
        { visit_number: 5, date: makeDate(12), timestamp: makeISO(12), phq9_score: 4, gad7_score: 3, weight: 54.2, sleep_hours: 7.5, diagnosis: 'Major Depressive Disorder', icd_code: 'F32.1', medications: ['Escitalopram 20mg'], notes: 'Minimal symptoms. Patient reports feeling much better.' },
      ],
    },
    // ── Patient 5: David Kumar — Asthma ──
    {
      id: 'DAV-38-M-2953',
      name: 'David Kumar',
      age: '38',
      gender: 'Male',
      blood_group: 'O-',
      contact: '9654321087',
      diagnosis: 'Asthma',
      icd_code: 'J45.9',
      total_visits: 5,
      first_visit: makeDate(95),
      last_visit: makeDate(8),
      created_at: makeISO(95),
      visits: [
        { visit_number: 1, date: makeDate(95), timestamp: makeISO(95), spo2: 91, respiratory_rate: 28, peak_flow: 220, heart_rate: 108, diagnosis: 'Asthma', icd_code: 'J45.9', medications: ['Salbutamol inhaler', 'Budesonide inhaler'], notes: 'Moderate persistent asthma. Started SABA + ICS.' },
        { visit_number: 2, date: makeDate(70), timestamp: makeISO(70), spo2: 94, respiratory_rate: 24, peak_flow: 280, heart_rate: 96, diagnosis: 'Asthma', icd_code: 'J45.9', medications: ['Salbutamol inhaler', 'Budesonide inhaler'], notes: 'Improvement. Peak flow increasing.' },
        { visit_number: 3, date: makeDate(48), timestamp: makeISO(48), spo2: 96, respiratory_rate: 20, peak_flow: 340, heart_rate: 88, diagnosis: 'Asthma', icd_code: 'J45.9', medications: ['Salbutamol PRN', 'Budesonide inhaler'], notes: 'Good control. Changed Salbutamol to PRN use.' },
        { visit_number: 4, date: makeDate(25), timestamp: makeISO(25), spo2: 97, respiratory_rate: 18, peak_flow: 390, heart_rate: 82, diagnosis: 'Asthma', icd_code: 'J45.9', medications: ['Salbutamol PRN', 'Budesonide inhaler'], notes: 'Near normal peak flow. Less rescue inhaler use.' },
        { visit_number: 5, date: makeDate(8), timestamp: makeISO(8), spo2: 98, respiratory_rate: 16, peak_flow: 430, heart_rate: 78, diagnosis: 'Asthma', icd_code: 'J45.9', medications: ['Salbutamol PRN', 'Budesonide inhaler'], notes: 'Excellent control. Symptom free most days.' },
      ],
    },
  ];

  writeAll(patients);
}

/* ── 8. getPatientsFromAPI ──────────────────────────────────────────────
   Fetches all EMR records from the backend MongoDB and converts them
   into the same patient/visits format used by localStorage.
   Ensures existing patients (Swayam, etc.) appear in Progress Tracking.
   Also handles future new patients saved through the EMR form.
────────────────────────────────────────────────────────────────────── */
export async function getPatientsFromAPI() {
  try {
    const token = localStorage.getItem('emr_token');
    if (!token) return [];

    const res = await fetch('http://localhost:5000/api/records/my', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];

    const { records } = await res.json();
    if (!records || records.length === 0) return [];

    const safeNum = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
      return isNaN(n) ? null : n;
    };

    // Group records by patientId (if present) or by lowercase trimmed name
    const patientMap = {};
    for (const record of records) {
      const nameKey = (record.patientName || 'Unknown').toLowerCase().trim().replace(/\s+/g, '_');
      const mapKey  = record.patientId || nameKey;

      if (!patientMap[mapKey]) {
        patientMap[mapKey] = {
          id:          record.patientId || generatePatientId(record.patientName || 'Unknown', '', ''),
          name:        record.patientName || 'Unknown',
          age:         '',
          gender:      '',
          blood_group: '',
          contact:     '',
          source:      'mongodb',
          visits:      [],
        };
      }

      const emr    = record.emrData || {};
      const vitals = emr.vitals    || {};

      // Parse blood pressure "145/92 mmHg" → systolic / diastolic
      let bp_systolic = null, bp_diastolic = null;
      if (vitals.bloodPressure) {
        const parts = String(vitals.bloodPressure).replace(/mmhg/gi, '').trim().split('/');
        if (parts.length === 2) {
          bp_systolic  = safeNum(parts[0]);
          bp_diastolic = safeNum(parts[1]);
        }
      }

      // Flatten medication objects → readable strings
      const meds = (emr.medications || []).map(m =>
        [m.name, m.dose, m.route, m.freq].filter(Boolean).join(' ')
      );

      patientMap[mapKey].visits.push({
        visit_number: 0, // assigned after sorting
        date:          new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp:     record.createdAt,
        bp_systolic,
        bp_diastolic,
        heart_rate:    safeNum(vitals.heartRate),
        temperature:   safeNum(vitals.temperature),
        spo2:          safeNum(vitals.oxygenSat),
        weight:        safeNum(vitals.weight),
        height:        safeNum(vitals.height),
        medications:   meds,
        notes:         emr.treatmentPlan || record.patientSummary || '',
        diagnosis:     emr.diagnosis || '',
        icd_code:      (emr.icdCodes || []).map(c => `${c.code} ${c.description}`).filter(Boolean).join(', '),
        source:        'mongodb',
        record_id:     record._id,
      });
    }

    // Sort visits by date, assign visit numbers, compute summary fields
    return Object.values(patientMap).map(p => {
      p.visits.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      p.visits       = p.visits.map((v, i) => ({ ...v, visit_number: i + 1 }));
      p.total_visits = p.visits.length;
      p.last_visit   = p.visits[p.visits.length - 1]?.date || '';
      p.first_visit  = p.visits[0]?.date || '';
      p.diagnosis    = p.visits[p.visits.length - 1]?.diagnosis || '';
      p.icd_code     = p.visits[p.visits.length - 1]?.icd_code  || '';
      return p;
    });
  } catch (e) {
    console.error('getPatientsFromAPI error:', e);
    return [];
  }
}
