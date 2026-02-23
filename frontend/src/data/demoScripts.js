// ───────────────────────────────────────────────────────────────────────
//  Demo Consultation Scripts — for Progress Tracking demo
// ───────────────────────────────────────────────────────────────────────

const demoScripts = [
  {
    id: 'cardiac_stemi',
    title: 'Cardiac Emergency — STEMI',
    diagnosis: 'Acute Myocardial Infarction',
    icd_code: 'I21.9',
    script: `Doctor: Good morning. What brings you in today?
Patient: Doctor, I have been having severe chest pain for the last 2 hours. It radiates to my left arm and jaw.
Doctor: How severe is the pain on a scale of 1 to 10?
Patient: About 9 out of 10. I also feel sweaty and short of breath.
Doctor: Let me take your vitals quickly. Blood pressure is 158 over 96, heart rate 102, SpO2 94%.
Patient: Is it serious, doctor?
Doctor: Your ECG shows ST elevation in leads II, III, aVF — this is a STEMI, a heart attack. We need to act immediately.
Doctor: I'm starting you on Aspirin 300mg and Clopidogrel 75mg right away. We're activating the cath lab for primary PCI.
Patient: Will I be okay?
Doctor: We caught it early. You're in the right place. We'll also start Atorvastatin 80mg and monitor you closely.
Doctor: Vitals on admission: BP 158/96 mmHg, HR 102 bpm, SpO2 94%, Weight 80kg.`,
    vitals: { bp_systolic: 158, bp_diastolic: 96, heart_rate: 102, spo2: 94, weight: 80 },
    medications: ['Aspirin 300mg loading dose', 'Clopidogrel 75mg', 'Atorvastatin 80mg', 'Heparin infusion'],
  },

  {
    id: 'diabetes_new',
    title: 'Type 2 Diabetes — New Diagnosis',
    diagnosis: 'Type 2 Diabetes',
    icd_code: 'E11',
    script: `Doctor: Good afternoon. What brings you here today?
Patient: Doctor, I have been feeling very thirsty all the time, and I urinate very frequently. I'm also always tired.
Doctor: How long has this been going on?
Patient: About 3 months. I've also lost about 5 kg without trying.
Doctor: These are concerning symptoms. Let me check your blood glucose... It reads 340 mg/dL — that's very high.
Patient: What does that mean?
Doctor: We'll do a confirmatory HbA1c test. Result is 10.2% — you have Type 2 Diabetes.
Doctor: Your blood pressure is 138 over 88 mmHg, heart rate 84, weight 72 kg.
Patient: What do I do now?
Doctor: We start with Metformin 500mg twice daily after meals. I'm also adding Glipizide 5mg to help your pancreas.
Doctor: You must reduce sugar, refined carbs, and increase physical activity. Come back in 4 weeks.
Patient: Will this get better?
Doctor: Absolutely. With medication and lifestyle changes, most patients see significant improvement. Let's track your progress.`,
    vitals: { bp_systolic: 138, bp_diastolic: 88, heart_rate: 84, weight: 72, glucose: 340, hba1c: 10.2 },
    medications: ['Metformin 500mg BD', 'Glipizide 5mg OD'],
  },

  {
    id: 'depression_new',
    title: 'Mental Health — Depression Evaluation',
    diagnosis: 'Major Depressive Disorder',
    icd_code: 'F32.1',
    script: `Doctor: Hello. Please take a seat. How can I help you today?
Patient: I don't know where to start. I just feel... empty. Like nothing matters anymore.
Doctor: How long have you been feeling this way?
Patient: About 4 months now. I can't sleep — maybe 4 hours a night. I've lost interest in everything I used to enjoy.
Doctor: Are you able to work or manage daily tasks?
Patient: Barely. I stay in bed most of the day. I've been missing work.
Doctor: Let me do a quick assessment. On the PHQ-9 questionnaire, your score is 18 out of 27 — that's severe depression.
Doctor: On the GAD-7 anxiety scale, you score 12 — moderate to severe anxiety as well.
Patient: Is this serious?
Doctor: Yes, but it's very treatable. Your weight is 52 kg, vitals are normal.
Doctor: I'm prescribing Escitalopram 10mg once daily in the morning. It takes 2-4 weeks to take full effect.
Doctor: I'm also adding Clonazepam 0.5mg at bedtime for the initial weeks to help with sleep and anxiety.
Patient: Will I feel better?
Doctor: Yes. Many patients see significant improvement with this medication. I also strongly recommend therapy.
Doctor: Let's meet again in 4 weeks to reassess.`,
    vitals: { weight: 52, sleep_hours: 4, phq9_score: 18, gad7_score: 12 },
    medications: ['Escitalopram 10mg OD morning', 'Clonazepam 0.5mg at bedtime'],
  },
];

export default demoScripts;
