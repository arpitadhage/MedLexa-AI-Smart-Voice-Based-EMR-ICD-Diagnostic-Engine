// Common ICD-10 codes with keyword matching
const ICD_CODES = [
  { code: 'G43.909', description: 'Migraine, unspecified', keywords: ['migraine', 'headache', 'head pain', 'cephalgia', 'cephalic', 'hemicrania'] },
  { code: 'J06.9',   description: 'Acute upper respiratory infection', keywords: ['cold', 'rhinitis', 'sore throat', 'upper respiratory', 'nasopharyngitis', 'pharyngitis'] },
  { code: 'J18.9',   description: 'Pneumonia, unspecified', keywords: ['pneumonia', 'chest infection', 'lung infection', 'lobar pneumonia'] },
  { code: 'J11.1',   description: 'Influenza with respiratory manifestations', keywords: ['flu', 'influenza', 'influenza-like', 'body ache', 'fever cough'] },
  { code: 'I10',     description: 'Essential hypertension', keywords: ['hypertension', 'high blood pressure', 'hbp', 'elevated bp', 'raised bp', 'systolic'] },
  { code: 'I50.9',   description: 'Heart failure, unspecified', keywords: ['heart failure', 'cardiac failure', 'congestive heart', 'chf'] },
  { code: 'I21.9',   description: 'Acute myocardial infarction', keywords: ['heart attack', 'myocardial infarction', 'mi', 'ami', 'chest pain cardiac'] },
  { code: 'I25.10',  description: 'Coronary artery disease', keywords: ['coronary artery', 'cad', 'ischemic heart', 'angina', 'chest pain exertion'] },
  { code: 'E11.9',   description: 'Type 2 diabetes mellitus', keywords: ['type 2 diabetes', 't2dm', 'dm2', 'diabetes mellitus type 2', 'non-insulin', 'niddm'] },
  { code: 'E10.9',   description: 'Type 1 diabetes mellitus', keywords: ['type 1 diabetes', 't1dm', 'dm1', 'insulin dependent', 'juvenile diabetes'] },
  { code: 'E11.65',  description: 'Type 2 diabetes with hyperglycemia', keywords: ['hyperglycemia', 'high blood sugar', 'elevated glucose', 'high glucose'] },
  { code: 'E03.9',   description: 'Hypothyroidism, unspecified', keywords: ['hypothyroid', 'thyroid deficiency', 'low thyroid', 'underactive thyroid'] },
  { code: 'E05.90',  description: 'Hyperthyroidism, unspecified', keywords: ['hyperthyroid', 'overactive thyroid', 'thyrotoxicosis', 'graves'] },
  { code: 'K21.0',   description: 'GERD with esophagitis', keywords: ['gerd', 'acid reflux', 'heartburn', 'esophageal reflux', 'gastroesophageal'] },
  { code: 'K25.9',   description: 'Gastric ulcer', keywords: ['gastric ulcer', 'stomach ulcer', 'peptic ulcer', 'h pylori', 'helicobacter'] },
  { code: 'K57.30',  description: 'Diverticulitis of large intestine', keywords: ['diverticulitis', 'diverticular', 'bowel inflammation'] },
  { code: 'K58.9',   description: 'Irritable bowel syndrome', keywords: ['ibs', 'irritable bowel', 'spastic colon', 'functional bowel'] },
  { code: 'K29.70',  description: 'Gastritis, unspecified', keywords: ['gastritis', 'stomach inflammation', 'gastric pain', 'stomach pain', 'epigastric'] },
  { code: 'M54.51',  description: 'Vertebrogenic low back pain', keywords: ['low back pain', 'back pain', 'lumbar pain', 'lumbago', 'lumbar', 'lower back'] },
  { code: 'M54.2',   description: 'Cervicalgia', keywords: ['neck pain', 'cervicalgia', 'cervical pain', 'neck ache', 'stiff neck'] },
  { code: 'M79.3',   description: 'Panniculitis', keywords: ['muscle pain', 'myalgia', 'fibromyalgia', 'body pain', 'diffuse pain'] },
  { code: 'M16.9',   description: 'Osteoarthritis of hip', keywords: ['hip arthritis', 'hip pain', 'osteoarthritis hip', 'hip joint'] },
  { code: 'M17.9',   description: 'Osteoarthritis of knee', keywords: ['knee arthritis', 'knee pain', 'osteoarthritis knee', 'knee joint', 'gonarthrosis'] },
  { code: 'M05.9',   description: 'Rheumatoid arthritis', keywords: ['rheumatoid arthritis', 'ra', 'inflammatory arthritis', 'autoimmune arthritis', 'joint inflammation'] },
  { code: 'J45.909', description: 'Unspecified asthma', keywords: ['asthma', 'bronchospasm', 'wheezing', 'reactive airway', 'bronchial asthma'] },
  { code: 'J44.1',   description: 'COPD with acute exacerbation', keywords: ['copd', 'chronic obstructive', 'emphysema', 'chronic bronchitis', 'dyspnea copd'] },
  { code: 'N39.0',   description: 'Urinary tract infection', keywords: ['uti', 'urinary tract infection', 'cystitis', 'urinary infection', 'dysuria', 'frequency urination'] },
  { code: 'N18.9',   description: 'Chronic kidney disease, unspecified', keywords: ['kidney disease', 'renal failure', 'ckd', 'chronic kidney', 'renal insufficiency'] },
  { code: 'F32.9',   description: 'Major depressive disorder, unspecified', keywords: ['depression', 'major depression', 'mdd', 'depressive disorder', 'depressed'] },
  { code: 'F41.1',   description: 'Generalized anxiety disorder', keywords: ['anxiety', 'gad', 'generalized anxiety', 'anxious', 'panic', 'worry'] },
  { code: 'F41.0',   description: 'Panic disorder', keywords: ['panic attack', 'panic disorder', 'palpitations anxiety', 'heart racing anxiety'] },
  { code: 'F43.10',  description: 'Post-traumatic stress disorder', keywords: ['ptsd', 'trauma', 'post traumatic', 'flashback', 'combat stress'] },
  { code: 'G40.909', description: 'Epilepsy, unspecified', keywords: ['epilepsy', 'seizure', 'convulsion', 'epileptic', 'fits'] },
  { code: 'G35',     description: 'Multiple sclerosis', keywords: ['multiple sclerosis', 'ms', 'demyelinating', 'optic neuritis ms'] },
  { code: 'G20',     description: "Parkinson's disease", keywords: ['parkinson', 'parkinsonism', 'tremor resting', 'rigidity bradykinesia'] },
  { code: 'G30.9',   description: "Alzheimer's disease", keywords: ['alzheimer', 'dementia', 'memory loss', 'cognitive decline'] },
  { code: 'L50.9',   description: 'Urticaria, unspecified', keywords: ['urticaria', 'hives', 'allergic rash', 'skin rash allergy'] },
  { code: 'L20.9',   description: 'Atopic dermatitis', keywords: ['eczema', 'atopic dermatitis', 'atopic', 'skin inflammation', 'pruritic rash'] },
  { code: 'H25.9',   description: 'Age-related cataract', keywords: ['cataract', 'lens opacity', 'cloudy vision', 'blurred vision cataract'] },
  { code: 'H40.9',   description: 'Unspecified glaucoma', keywords: ['glaucoma', 'intraocular pressure', 'optic nerve damage'] },
  { code: 'C34.10',  description: 'Malignant neoplasm of upper lobe, lung', keywords: ['lung cancer', 'bronchogenic carcinoma', 'lung carcinoma', 'pulmonary malignancy'] },
  { code: 'C50.919', description: 'Malignant neoplasm of breast', keywords: ['breast cancer', 'mammary carcinoma', 'breast malignancy', 'breast tumor'] },
  { code: 'C18.9',   description: 'Malignant neoplasm of colon', keywords: ['colon cancer', 'colorectal cancer', 'bowel cancer', 'colonic carcinoma'] },
  { code: 'Z23',     description: 'Encounter for immunization', keywords: ['vaccination', 'immunization', 'vaccine', 'booster'] },
  { code: 'Z00.00',  description: 'Encounter for general adult examination', keywords: ['routine checkup', 'annual exam', 'general examination', 'health check', 'well visit'] },
  { code: 'R50.9',   description: 'Fever, unspecified', keywords: ['fever', 'pyrexia', 'high temperature', 'febrile'] },
  { code: 'R05.9',   description: 'Cough, unspecified', keywords: ['cough', 'dry cough', 'productive cough', 'chronic cough'] },
  { code: 'R06.00',  description: 'Dyspnea, unspecified', keywords: ['shortness of breath', 'dyspnea', 'breathlessness', 'sob', 'difficulty breathing'] },
  { code: 'R10.9',   description: 'Unspecified abdominal pain', keywords: ['abdominal pain', 'stomach ache', 'belly pain', 'abdominal cramps', 'tummy pain'] },
  { code: 'R51.9',   description: 'Headache, unspecified', keywords: ['headache', 'head pain', 'cephalalgia'] },
  { code: 'R55',     description: 'Syncope and collapse', keywords: ['syncope', 'fainting', 'blackout', 'loss of consciousness', 'passed out'] },
  { code: 'S00.90',  description: 'Unspecified superficial injury of head', keywords: ['head injury', 'scalp wound', 'head trauma', 'head laceration'] },
  { code: 'T14.9',   description: 'Injury, unspecified', keywords: ['injury', 'trauma', 'wound', 'laceration', 'fracture'] },
  { code: 'A09',     description: 'Infectious gastroenteritis and colitis', keywords: ['gastroenteritis', 'food poisoning', 'diarrhea vomiting', 'stomach bug', 'gi infection'] },
  { code: 'B19.9',   description: 'Unspecified viral hepatitis', keywords: ['hepatitis', 'liver infection', 'jaundice viral', 'viral hepatitis'] },
  { code: 'O80',     description: 'Encounter for full-term uncomplicated delivery', keywords: ['delivery', 'childbirth', 'labor', 'normal delivery', 'vaginal birth'] },
];

/**
 * Match a diagnosis string to the best ICD code(s).
 * Returns up to `max` matches sorted by relevance score.
 */
export function suggestICDCodes(diagnosisText, max = 5) {
  if (!diagnosisText || !diagnosisText.trim()) return [];
  const lower = diagnosisText.toLowerCase();
  const scored = ICD_CODES.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.split(' ').length; // longer keyword = higher score
      }
    }
    return { ...entry, score };
  })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max);
}

export default ICD_CODES;
