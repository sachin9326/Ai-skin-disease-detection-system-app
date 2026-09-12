/**
 * Vision AI Service for SkinScan AI (Clinical Decision Support System)
 * Supports Anthropic Claude Vision API, Google Gemini Vision API,
 * and a Smart Fallback Clinical Analyzer with Multimodal context integration.
 */

import dotenv from 'dotenv';
dotenv.config();

import { extractNodeImageFeatures, classifyNodeSkinDisease } from './classifierEngine.js';

const MODEL_VERSION = 'v3.0-CDSS-ExpertProtocol';


// ─── EXPERT DERMATOSCOPIC DIAGNOSTIC PROTOCOL — 4-STEP SYSTEM PROMPT ────────
const SYSTEM_PROMPT = `
You are an expert dermatological imaging diagnostic assistant and clinical research engine operating within the SkinScan AI Clinical Decision Support System (CDSS).
Your objective is to evaluate dermatoscopic and clinical images of skin lesions with extreme diagnostic rigor, minimize false negatives, and return structured, reproducible differential assessments.

You MUST follow this 4-step systematic analytical protocol before providing any output:

═══════════════════════════════════════════════════════════════
STEP 1 — IMAGE INTEGRITY & PREPROCESSING VALIDATION
═══════════════════════════════════════════════════════════════
Evaluate:
- Image clarity (sharp focus vs. motion blur, depth-of-field issues)
- Illumination artifacts (overexposure, underexposure, specular reflections, flash glare)
- Whether the lesion is fully framed within the image boundaries
- Confounding artifacts: body hair, dermoscopic ruler marks, ink markings, reflections
- Fitzpatrick skin phototype (I–VI) to account for pigment presentation bias
  Type I=Very Light/Pale White, Type II=Fair/White, Type III=Medium Fair/Olive,
  Type IV=Olive/Moderate Brown, Type V=Brown/Dark Brown, Type VI=Deep Dark Brown/Black

═══════════════════════════════════════════════════════════════
STEP 2 — MORPHOLOGICAL DECONSTRUCTION (ABCDE CRITERIA)
═══════════════════════════════════════════════════════════════
Document EACH of the following explicitly:
1. ASYMMETRY — Structural and pigmentary asymmetry along both perpendicular axes
   Score: "None" | "Low" | "Moderate" | "High"
2. BORDER — Sharp, well-demarcated vs. irregular, notched, ragged, or blurred borders
3. COLOR VARIATION — All distinct shades present: tan, brown, black, white, red, blue-gray, pink, orange
4. DIAMETER & DERMOSCOPIC STRUCTURES — Lesion architecture:
   Pigment network (regular/atypical), blue-white veil, regression structures, dots/globules,
   streaks, milia-like cysts, comedo-like openings, vessels, scarring
5. EVOLUTION / SURFACE TEXTURE — Macular, papular, nodular, verrucous, ulceration, scaling, crusting, erosion

═══════════════════════════════════════════════════════════════
STEP 3 — DIFFERENTIAL DIAGNOSIS & REASONING CHAIN
═══════════════════════════════════════════════════════════════
- Rank differentials STRICTLY based on Step 2 morphological patterns
- DO NOT anchor on a single feature. Contrast primary suspected condition against mimics:
  e.g., Seborrheic Keratosis vs. Melanoma, Basal Cell Carcinoma vs. Dermal Nevus,
  Psoriasis vs. Tinea, Rosacea vs. Lupus, Eczema vs. Contact Dermatitis
- Assign probability brackets:
  High (>70%) | Moderate (40–70%) | Low (<40%)

═══════════════════════════════════════════════════════════════
STEP 4 — MANDATORY CLINICAL RED FLAGS & NEXT STEPS
═══════════════════════════════════════════════════════════════
- Flag ANY high-risk malignant indicators requiring urgent biopsy
- State environmental or diagnostic limitations where visual assessment is inherently indeterminate
- Escalate to "Urgent dermoscopy/biopsy" if ANY of: asymmetric pigmented lesion with border irregularity,
  blue-white veil, regression structures, bleeding, ulceration, rapid evolution

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — Return ONLY this valid JSON object, no markdown, no preamble:
═══════════════════════════════════════════════════════════════
{
  "image_quality": {
    "clarity": "Adequate | Suboptimal | Insufficient",
    "fitzpatrick_type_estimate": "Type I | Type II | Type III | Type IV | Type V | Type VI",
    "artifacts_present": ["list of artifacts or none"]
  },
  "morphological_features": {
    "asymmetry": "None | Low | Moderate | High — with axis description",
    "border_characteristics": "detailed border description",
    "color_distribution": ["list of observed color shades"],
    "dermoscopic_structures": ["pigment network", "blue-white veil", "globules", "etc."]
  },
  "primary_diagnosis": {
    "condition_name": "Full condition name (e.g., Melanoma, Psoriasis Vulgaris)",
    "confidence_level": "High | Moderate | Low",
    "justification": "Detailed anatomical and visual justification referencing Step 2 findings"
  },
  "differential_diagnoses": [
    {
      "condition_name": "string",
      "likelihood": "Moderate | Low",
      "differentiating_factors": "Why this is less likely than the primary diagnosis"
    }
  ],
  "malignancy_risk": "Benign | Indeterminate | Suspicious | Highly Suspicious",
  "recommended_clinical_action": "Routine monitoring | Non-urgent consult | Urgent dermoscopy/biopsy",
  "abcde_detail": {
    "asymmetry": "Structured axis-by-axis description",
    "border": "Border irregularity assessment",
    "color": "All color variants identified",
    "diameter_and_structures": "Size estimate and dermoscopic architecture",
    "evolution_surface": "Surface texture and reported change pattern"
  },
  "triage": {
    "level": "Emergency | Same-Day | Dermatologist Soon | Routine Consultation | Monitor",
    "score": 3,
    "redFlags": ["any high-risk indicators"],
    "escalationReason": "Clinical rationale for triage level"
  },
  "uncertaintySystem": {
    "isUncertain": false,
    "oodDetected": false,
    "reason": "",
    "confidenceSufficient": true
  },
  "visualObservations": {
    "color": "Dominant color description",
    "texture": "Surface texture",
    "borders": "Border assessment",
    "inflammation": "Low | Moderate | High",
    "lesionType": "Patch | Plaque | Papule | Macule | Nodule | Vesicle",
    "skinToneCalibration": "Fitzpatrick Type (Name)"
  },
  "medicationSafety": {
    "warnings": ["Critical warnings, especially steroid misuse on fungal lesions"],
    "safeGeneralAdvice": ["Safe OTC guidance"],
    "contraindications": ["Contraindicated actions"]
  },
  "recommendations": ["Actionable care steps ranked by priority"],
  "disclaimer": "SkinScan AI is a Clinical Decision Support System and does not replace formal medical diagnosis. Present this report to a licensed dermatologist."
}
`;

/**
 * Main handler to analyze skin image + symptoms context
 */
export async function analyzeSkinImage({ imageBase64, provider, apiKey, model, symptoms = {} }) {
  const startTime = Date.now();
  const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const activeProvider = provider || process.env.VISION_PROVIDER || 'demo';
  const anthropicKey = (activeProvider === 'claude' && apiKey) ? apiKey : process.env.ANTHROPIC_API_KEY;
  const geminiKey = (activeProvider === 'gemini' && apiKey) ? apiKey : process.env.GEMINI_API_KEY;

  let result = null;

  if (activeProvider === 'claude' && anthropicKey) {
    try {
      const raw = await callClaudeVision(base64Clean, anthropicKey, model || 'claude-3-5-sonnet-20241022', symptoms);
      result = normalizeVisionResponse(raw);
    } catch (err) {
      console.warn('Claude API failed, falling back to smart analyzer:', err.message);
    }
  }

  if (!result && activeProvider === 'gemini' && geminiKey) {
    try {
      const raw = await callGeminiVision(base64Clean, geminiKey, symptoms);
      result = normalizeVisionResponse(raw);
    } catch (err) {
      console.warn('Gemini API failed, falling back to smart analyzer:', err.message);
    }
  }

  // Fallback to local smart analyzer
  if (!result) {
    const raw = runSmartFallbackAnalyzer(base64Clean, symptoms);
    result = normalizeVisionResponse(raw);
  }

  // Attach traceability metadata
  result.modelMetadata = {
    version: MODEL_VERSION,
    provider: activeProvider,
    timestamp: new Date().toISOString(),
    inferenceTimeMs: Date.now() - startTime
  };

  return result;
}

/**
 * Calls Anthropic Claude Vision API
 */
async function callClaudeVision(base64Image, apiKey, model, symptoms) {
  const symptomsText = formatSymptomsForPrompt(symptoms);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: `Analyze this skin image alongside patient context:\n${symptomsText}\n\nReturn the requested JSON output structure.`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';
  const cleanedText = rawText.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanedText);
}

/**
 * Calls Google Gemini Vision API
 */
async function callGeminiVision(base64Image, apiKey, symptoms) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const symptomsText = formatSymptomsForPrompt(symptoms);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT + `\nAnalyze this skin image alongside patient context:\n${symptomsText}` },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: { response_mime_type: 'application/json' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanedText = rawText.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleanedText);
}

function formatSymptomsForPrompt(symptoms) {
  if (!symptoms || Object.keys(symptoms).length === 0) return 'No additional patient symptoms reported.';
  return Object.entries(symptoms)
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
}

// ─── RESPONSE NORMALIZER — BRIDGES NEW PROTOCOL SCHEMA ↔ LEGACY UI SCHEMA ────
/**
 * Accepts either the new 4-step protocol JSON schema or the legacy schema.
 * Always returns an object with ALL fields needed by AnalysisView.jsx,
 * enriched with the new protocol fields where available.
 *
 * @param {Object} raw - Raw JSON object from LLM or fallback classifier
 * @returns {Object} Normalized response compatible with both old and new UI
 */
function normalizeVisionResponse(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  // ── Detect which schema we received ──────────────────────────────────────
  const isNewProtocol = raw.image_quality && raw.primary_diagnosis && raw.morphological_features;

  if (!isNewProtocol) {
    // Legacy schema — pass through but attach empty new-protocol stubs so UI
    // new panels gracefully skip rendering when data is absent.
    return {
      ...raw,
      image_quality: raw.image_quality || null,
      morphological_features: raw.morphological_features || null,
      malignancy_risk: raw.malignancy_risk || deriveMalignancyRisk(raw),
      recommended_clinical_action: raw.recommended_clinical_action || deriveClinicialAction(raw),
    };
  }

  // ── Map new protocol schema → legacy fields for AnalysisView compatibility ─
  const pd = raw.primary_diagnosis || {};
  const triage = raw.triage || {};
  const morpho = raw.morphological_features || {};
  const abcde = raw.abcde_detail || {};

  // Confidence_level → numeric confidence
  const confidenceMap = { 'High': 87, 'Moderate': 62, 'Low': 38 };
  const numericConfidence = confidenceMap[pd.confidence_level] || 65;

  // malignancy_risk → severity + severityScore
  const malignancyToSeverity = {
    'Benign': { severity: 'Early', severityScore: 2 },
    'Indeterminate': { severity: 'Mid', severityScore: 5 },
    'Suspicious': { severity: 'Mid', severityScore: 7 },
    'Highly Suspicious': { severity: 'Extreme', severityScore: 9 },
  };
  const { severity, severityScore } = malignancyToSeverity[raw.malignancy_risk] || { severity: 'Mid', severityScore: 5 };

  // recommended_clinical_action → triage.level
  const actionToTriage = {
    'Routine monitoring': 'Monitor',
    'Non-urgent consult': 'Routine Consultation',
    'Urgent dermoscopy/biopsy': 'Dermatologist Soon',
  };
  const derivedTriageLevel = actionToTriage[raw.recommended_clinical_action]
    || triage.level
    || 'Routine Consultation';

  // Map new differential format → legacy format for existing differential panel
  const legacyDifferentials = (raw.differential_diagnoses || []).map((d, i) => ({
    name: d.condition_name || d.name || 'Unknown',
    confidence: d.likelihood === 'Moderate' ? 58 : d.likelihood === 'Low' ? 32 : (d.confidence || 40),
    description: d.differentiating_factors || d.description || '',
    supportingFeatures: d.supportingFeatures || [],
    unfittingFeatures: d.unfittingFeatures || [d.differentiating_factors].filter(Boolean),
    distinguishingFactors: d.differentiating_factors || '',
    icd10: d.icd10 || '',
  }));

  // Map abcde_detail → legacy abcdeAnalysis format
  const legacyAbcde = {
    asymmetry: abcde.asymmetry || morpho.asymmetry || '',
    border: abcde.border || morpho.border_characteristics || '',
    color: abcde.color || (morpho.color_distribution || []).join(', ') || '',
    diameter: abcde.diameter_and_structures || '',
    evolution: abcde.evolution_surface || '',
    riskSummary: raw.malignancy_risk
      ? `Malignancy Risk: ${raw.malignancy_risk} — ${raw.recommended_clinical_action || ''}`
      : '',
  };

  // Visual observations — prefer existing block, enrich from morphological data
  const visualObs = raw.visualObservations || {
    color: (morpho.color_distribution || []).join(', ') || '',
    texture: abcde.evolution_surface || '',
    borders: morpho.border_characteristics || '',
    inflammation: 'Moderate',
    lesionType: '',
    skinToneCalibration: raw.image_quality?.fitzpatrick_type_estimate || '',
  };

  return {
    // ── New protocol fields (preserved verbatim for new UI panels) ──────────
    image_quality: raw.image_quality,
    morphological_features: raw.morphological_features,
    malignancy_risk: raw.malignancy_risk,
    recommended_clinical_action: raw.recommended_clinical_action,
    primary_diagnosis: raw.primary_diagnosis,

    // ── Legacy fields (mapped from new schema) ─────────────────────────────
    primaryCondition: pd.condition_name || 'Skin Lesion Assessment',
    confidence: numericConfidence,
    severity,
    severityScore,
    explanation: pd.justification || raw.explanation || '',
    visualObservations: visualObs,
    triage: {
      level: derivedTriageLevel,
      score: triage.score || (raw.malignancy_risk === 'Highly Suspicious' ? 4 : raw.malignancy_risk === 'Suspicious' ? 3 : 2),
      redFlags: triage.redFlags || [],
      escalationReason: triage.escalationReason || raw.recommended_clinical_action || '',
    },
    uncertaintySystem: raw.uncertaintySystem || {
      isUncertain: pd.confidence_level === 'Low',
      oodDetected: pd.confidence_level === 'Low',
      reason: pd.confidence_level === 'Low' ? 'Low diagnostic confidence — clinical dermoscopy recommended.' : '',
      confidenceSufficient: pd.confidence_level !== 'Low',
    },
    abcdeAnalysis: legacyAbcde,
    differentialDiagnoses: legacyDifferentials,
    medicationSafety: raw.medicationSafety || { warnings: [], safeGeneralAdvice: [], contraindications: [] },
    recommendations: raw.recommendations || [],
    disclaimer: raw.disclaimer || 'SkinScan AI is a Clinical Decision Support System. Please consult a licensed dermatologist.',
  };
}

/** Derive malignancy risk from legacy schema triage/confidence data */
function deriveMalignancyRisk(data) {
  const level = data?.triage?.level || '';
  const sev = data?.severity || '';
  if (level === 'Emergency' || sev === 'Extreme') return 'Highly Suspicious';
  if (level === 'Dermatologist Soon' || level === 'Same-Day') return 'Suspicious';
  if (data?.uncertaintySystem?.isUncertain) return 'Indeterminate';
  return 'Benign';
}

/** Derive recommended_clinical_action from legacy triage level */
function deriveClinicialAction(data) {
  const level = data?.triage?.level || '';
  if (level === 'Emergency' || level === 'Same-Day' || level === 'Dermatologist Soon') return 'Urgent dermoscopy/biopsy';
  if (level === 'Routine Consultation') return 'Non-urgent consult';
  return 'Routine monitoring';
}

/**
 * Smart Fallback Analyzer with Clinical Context & Real Image Pixel Feature Extraction
 */
function runSmartFallbackAnalyzer(base64Image, symptoms = {}) {
  // Check image validity / uncertainty trigger
  const isTooSmall = !base64Image || base64Image.length < 300;
  if (isTooSmall || symptoms.unusualPresentation === true) {
    return {
      primaryCondition: "Uncertain Skin Presentation",
      confidence: 32,
      severity: "Mid",
      severityScore: 4,
      explanation: "AI confidence is insufficient for a reliable assessment. The lesion presentation is atypical or image detail is unclear.",
      visualObservations: {
        color: "Indeterminate",
        texture: "Indeterminate",
        borders: "Poorly defined",
        inflammation: "Moderate",
        lesionType: "Uncertain"
      },
      triage: {
        level: "Dermatologist Soon",
        score: 3,
        redFlags: ["Ambiguous visual morphology", "Low model confidence (<50%)"],
        escalationReason: "Uncertain clinical presentation requires direct dermoscopic examination by a physician."
      },
      uncertaintySystem: {
        isUncertain: true,
        oodDetected: true,
        reason: "Image characteristics or symptom combination fall outside standard high-confidence pattern clusters.",
        confidenceSufficient: false
      },
      abcdeAnalysis: {
        asymmetry: "Requires dermoscopic verification",
        border: "Indistinct border margins",
        color: "Variegated shading",
        diameter: "Needs manual measurement",
        evolution: symptoms.duration || "Unclear evolution history",
        riskSummary: "Professional dermoscopy indicated."
      },
      differentialDiagnoses: [
        {
          name: "Atypical Skin Presentation",
          confidence: 35,
          description: "Lesion characteristics require clinical biopsy or dermoscopy.",
          supportingFeatures: ["User reported lesion on " + (symptoms.bodyLocation || "skin")],
          unfittingFeatures: ["Atypical morphology"],
          distinguishingFactors: "Dermoscopic examination is essential to differentiate benign vs dysplastic features."
        }
      ],
      medicationSafety: {
        warnings: ["Do NOT self-medicate with strong steroid creams without diagnosis."],
        safeGeneralAdvice: ["Avoid picking or scratching the affected skin."],
        contraindications: ["Avoid unverified herbal compresses."]
      },
      recommendations: [
        "Schedule an in-person or tele-dermatology appointment.",
        "Take clear photos under bright daylight every 3 days to track changes.",
        "Avoid applying harsh soaps or unprescribed topical ointments."
      ],
      adaptiveFollowUps: [
        "Has the spot changed size, color, or shape in the past month?",
        "Do you have a personal or family history of skin cancer?"
      ],
      disclaimer: "SkinScan AI Safety Guardrail: Confidence is insufficient for reliable classification. Please consult a qualified dermatologist."
    };
  }

  // Perform real pixel feature extraction & multimodal classification
  const features = extractNodeImageFeatures(base64Image);
  return classifyNodeSkinDisease(features, symptoms);
}

