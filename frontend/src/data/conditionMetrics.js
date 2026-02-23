// ───────────────────────────────────────────────────────────────────────
//  Condition → Metrics mapping for Progress Tracking
// ───────────────────────────────────────────────────────────────────────

export const METRIC_LABELS = {
  bp_systolic:      'Systolic BP',
  bp_diastolic:     'Diastolic BP',
  heart_rate:       'Heart Rate',
  temperature:      'Temperature',
  spo2:             'SpO₂',
  weight:           'Weight',
  height:           'Height',
  respiratory_rate: 'Respiratory Rate',
  glucose:          'Blood Glucose',
  hba1c:            'HbA1c',
  cholesterol:      'Cholesterol',
  creatinine:       'Creatinine',
  hemoglobin:       'Hemoglobin',
  tsh_level:        'TSH Level',
  peak_flow:        'Peak Flow',
  troponin:         'Troponin',
  phq9_score:       'PHQ-9 Score',
  gad7_score:       'GAD-7 Score',
  pain_score:       'Pain Score',
  sleep_hours:      'Sleep Hours',
};

export const METRIC_ICONS = {
  bp_systolic: '🩸', bp_diastolic: '🩸', heart_rate: '❤️',
  temperature: '🌡️', spo2: '💨', weight: '⚖️', height: '📏',
  respiratory_rate: '🌬️', glucose: '🍭', hba1c: '💉',
  cholesterol: '🔬', creatinine: '🧪', hemoglobin: '🩺',
  tsh_level: '🦋', peak_flow: '💨', troponin: '❤️',
  phq9_score: '🧠', gad7_score: '😰', pain_score: '😣', sleep_hours: '😴',
};

// lower_is_better: true  → decreasing is green
// lower_is_better: false → increasing is green
export const conditionMetrics = {
  'Type 2 Diabetes': {
    primary: ['glucose', 'hba1c'],
    secondary: ['weight', 'bp_systolic', 'bp_diastolic'],
    targets: {
      glucose:      { min: 70, max: 140, unit: 'mg/dL',  lower_is_better: true },
      hba1c:        { min: 4,  max: 6.5, unit: '%',       lower_is_better: true },
      weight:       { min: null, max: null, unit: 'kg',   lower_is_better: true },
      bp_systolic:  { min: 90, max: 120,  unit: 'mmHg',  lower_is_better: true },
      bp_diastolic: { min: 60, max: 80,   unit: 'mmHg',  lower_is_better: true },
    },
  },

  'Hypertension': {
    primary: ['bp_systolic', 'bp_diastolic'],
    secondary: ['heart_rate', 'weight'],
    targets: {
      bp_systolic:  { min: 90, max: 120, unit: 'mmHg', lower_is_better: true },
      bp_diastolic: { min: 60, max: 80,  unit: 'mmHg', lower_is_better: true },
      heart_rate:   { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
      weight:       { min: null, max: null, unit: 'kg', lower_is_better: true },
    },
  },

  'Acute Myocardial Infarction': {
    primary: ['bp_systolic', 'heart_rate', 'spo2'],
    secondary: ['bp_diastolic', 'weight'],
    targets: {
      bp_systolic:  { min: 90, max: 120, unit: 'mmHg', lower_is_better: true },
      heart_rate:   { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
      spo2:         { min: 95, max: 100, unit: '%',     lower_is_better: false },
      bp_diastolic: { min: 60, max: 80,  unit: 'mmHg', lower_is_better: true },
      weight:       { min: null, max: null, unit: 'kg', lower_is_better: true },
    },
  },

  'Heart Failure': {
    primary: ['bp_systolic', 'bp_diastolic', 'weight'],
    secondary: ['heart_rate', 'spo2'],
    targets: {
      bp_systolic:  { min: 90, max: 120, unit: 'mmHg', lower_is_better: true },
      bp_diastolic: { min: 60, max: 80,  unit: 'mmHg', lower_is_better: true },
      weight:       { min: null, max: null, unit: 'kg', lower_is_better: true },
      spo2:         { min: 95, max: 100, unit: '%',     lower_is_better: false },
      heart_rate:   { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
    },
  },

  'Pneumonia': {
    primary: ['spo2', 'temperature', 'heart_rate'],
    secondary: ['respiratory_rate'],
    targets: {
      spo2:             { min: 95, max: 100, unit: '%',    lower_is_better: false },
      temperature:      { min: 97, max: 99,  unit: '°F',   lower_is_better: true },
      heart_rate:       { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
      respiratory_rate: { min: 12, max: 20,  unit: '/min', lower_is_better: true },
    },
  },

  'Major Depressive Disorder': {
    primary: ['phq9_score', 'gad7_score'],
    secondary: ['weight', 'sleep_hours'],
    targets: {
      phq9_score:  { min: 0, max: 4, unit: 'score', lower_is_better: true },
      gad7_score:  { min: 0, max: 4, unit: 'score', lower_is_better: true },
      sleep_hours: { min: 7, max: 9, unit: 'hrs',   lower_is_better: false },
      weight:      { min: null, max: null, unit: 'kg', lower_is_better: false },
    },
  },

  'Post Operative Recovery': {
    primary: ['pain_score', 'temperature', 'spo2'],
    secondary: ['bp_systolic', 'heart_rate'],
    targets: {
      pain_score:  { min: 0, max: 3,   unit: '/10',  lower_is_better: true },
      temperature: { min: 97, max: 99, unit: '°F',   lower_is_better: true },
      spo2:        { min: 95, max: 100, unit: '%',    lower_is_better: false },
      bp_systolic: { min: 90, max: 120, unit: 'mmHg', lower_is_better: true },
      heart_rate:  { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
    },
  },

  'Asthma': {
    primary: ['spo2', 'respiratory_rate', 'peak_flow'],
    secondary: ['heart_rate'],
    targets: {
      spo2:             { min: 95, max: 100, unit: '%',    lower_is_better: false },
      respiratory_rate: { min: 12, max: 20,  unit: '/min', lower_is_better: true },
      peak_flow:        { min: 400, max: null, unit: 'L/min', lower_is_better: false },
      heart_rate:       { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
    },
  },

  'Chronic Kidney Disease': {
    primary: ['creatinine', 'bp_systolic', 'bp_diastolic'],
    secondary: ['weight'],
    targets: {
      creatinine:   { min: 0.6, max: 1.2,  unit: 'mg/dL', lower_is_better: true },
      bp_systolic:  { min: 90,  max: 120,  unit: 'mmHg',  lower_is_better: true },
      bp_diastolic: { min: 60,  max: 80,   unit: 'mmHg',  lower_is_better: true },
      weight:       { min: null, max: null, unit: 'kg',    lower_is_better: true },
    },
  },

  'Hypothyroidism': {
    primary: ['tsh_level', 'weight'],
    secondary: ['heart_rate'],
    targets: {
      tsh_level:  { min: 0.4, max: 4.0, unit: 'mIU/L', lower_is_better: true },
      weight:     { min: null, max: null, unit: 'kg',   lower_is_better: true },
      heart_rate: { min: 60,  max: 100,  unit: 'bpm',  lower_is_better: false },
    },
  },

  'Anemia': {
    primary: ['hemoglobin', 'heart_rate'],
    secondary: ['weight', 'spo2'],
    targets: {
      hemoglobin: { min: 12, max: 17,  unit: 'g/dL', lower_is_better: false },
      heart_rate: { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
      spo2:       { min: 95, max: 100, unit: '%',    lower_is_better: false },
      weight:     { min: null, max: null, unit: 'kg', lower_is_better: false },
    },
  },

  'Default': {
    primary: ['bp_systolic', 'heart_rate', 'spo2'],
    secondary: ['weight', 'temperature'],
    targets: {
      bp_systolic:  { min: 90, max: 120, unit: 'mmHg', lower_is_better: true },
      bp_diastolic: { min: 60, max: 80,  unit: 'mmHg', lower_is_better: true },
      heart_rate:   { min: 60, max: 100, unit: 'bpm',  lower_is_better: true },
      spo2:         { min: 95, max: 100, unit: '%',     lower_is_better: false },
      temperature:  { min: 97, max: 99,  unit: '°F',   lower_is_better: true },
      weight:       { min: null, max: null, unit: 'kg', lower_is_better: true },
    },
  },
};

/* ── getMetricsForCondition ── */
export function getMetricsForCondition(diagnosis = '') {
  if (!diagnosis) return conditionMetrics['Default'];
  // Exact match
  if (conditionMetrics[diagnosis]) return conditionMetrics[diagnosis];
  // Partial match
  const diag = diagnosis.toLowerCase();
  const key = Object.keys(conditionMetrics).find(k =>
    k !== 'Default' && (k.toLowerCase().includes(diag) || diag.includes(k.toLowerCase()))
  );
  return key ? conditionMetrics[key] : conditionMetrics['Default'];
}

/* ── autoDetectMetrics ── */
export function autoDetectMetrics(visits = []) {
  if (!visits.length) return [];
  const allKeys = new Set();
  visits.forEach(v => {
    Object.entries(v).forEach(([k, val]) => {
      if (METRIC_LABELS[k] && val !== null && val !== undefined && val !== '') {
        allKeys.add(k);
      }
    });
  });
  return [...allKeys];
}
