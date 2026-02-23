// ───────────────────────────────────────────────────────────────────────
//  extractVitalsFromEMR — parses AI-extracted EMR JSON into flat vitals
// ───────────────────────────────────────────────────────────────────────

export function extractVitalsFromEMR(emrData = {}) {
  try {
    const vitals = emrData.vitals || emrData || {};

    const safeNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const n = parseFloat(String(val).replace(/[^\d.]/g, ''));
      return isNaN(n) ? null : n;
    };

    // Parse blood pressure "145/92 mmHg" → systolic & diastolic
    let bp_systolic = null;
    let bp_diastolic = null;
    const bpRaw =
      vitals.bloodPressure || vitals.blood_pressure ||
      vitals.bp || emrData.blood_pressure || '';
    if (bpRaw) {
      const parts = String(bpRaw).replace(/mmhg/gi, '').trim().split('/');
      if (parts.length === 2) {
        bp_systolic = safeNum(parts[0]);
        bp_diastolic = safeNum(parts[1]);
      }
    }
    // Also accept flat fields
    if (bp_systolic === null) bp_systolic = safeNum(vitals.bpSystolic || vitals.bp_systolic || emrData.bpSystolic);
    if (bp_diastolic === null) bp_diastolic = safeNum(vitals.bpDiastolic || vitals.bp_diastolic || emrData.bpDiastolic);

    return {
      bp_systolic,
      bp_diastolic,
      heart_rate:        safeNum(vitals.heartRate   || vitals.heart_rate   || emrData.heartRate),
      temperature:       safeNum(vitals.temperature || emrData.temperature),
      spo2:              safeNum(vitals.oxygenSat   || vitals.spo2         || vitals.oxygenSaturation || emrData.oxygenSaturation),
      weight:            safeNum(vitals.weight      || emrData.weight),
      height:            safeNum(vitals.height      || emrData.height),
      respiratory_rate:  safeNum(vitals.respiratoryRate || vitals.respiratory_rate || emrData.respiratoryRate),
      glucose:           safeNum(vitals.glucose     || emrData.glucose     || emrData.bloodGlucose),
      hba1c:             safeNum(vitals.hba1c       || emrData.hba1c       || emrData.hbA1c),
      cholesterol:       safeNum(vitals.cholesterol || emrData.cholesterol),
      creatinine:        safeNum(vitals.creatinine  || emrData.creatinine),
      hemoglobin:        safeNum(vitals.hemoglobin  || emrData.hemoglobin  || emrData.hb),
      tsh_level:         safeNum(vitals.tsh         || vitals.tsh_level    || emrData.tsh),
      peak_flow:         safeNum(vitals.peakFlow    || vitals.peak_flow    || emrData.peakFlow),
      troponin:          safeNum(vitals.troponin    || emrData.troponin),
      phq9_score:        safeNum(vitals.phq9        || vitals.phq9_score   || emrData.phq9),
      gad7_score:        safeNum(vitals.gad7        || vitals.gad7_score   || emrData.gad7),
      pain_score:        safeNum(vitals.painScore   || vitals.pain_score   || emrData.painScore),
      sleep_hours:       safeNum(vitals.sleepHours  || vitals.sleep_hours  || emrData.sleepHours),
    };
  } catch (e) {
    console.error('extractVitalsFromEMR error:', e);
    return {};
  }
}
