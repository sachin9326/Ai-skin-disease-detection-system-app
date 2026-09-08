/**
 * Vision AI Service for SkinScan AI (Clinical Decision Support System)
 * Supports Anthropic Claude Vision API, Google Gemini Vision API,
 * and a Smart Fallback Clinical Analyzer with Multimodal context integration.
 */

import dotenv from 'dotenv';
dotenv.config();

import { extractNodeImageFeatures, classifyNodeSkinDisease } from './classifierEngine.js';

const MODEL_VERSION = 'v2.5-CDSS-Enhanced';


const SYSTEM_PROMPT = `
You are an expert AI dermatology decision-support assistant for SkinScan AI.
Your purpose is to analyze skin image features alongside patient-reported symptoms, body location, and medical context.
You act STRICTLY as a Clinical Decision Support System (CDSS), prioritizing safety, escalation, and uncertainty detection over speculation.

STRICT RULES:
1. Describe visible skin features objectively: color, texture, borders, inflammation, lesion distribution.
2. If image quality is poor OR presentation is ambiguous / outside model distribution, set "uncertaintySystem.isUncertain" to true and explain why.
3. Compute Triage Level into EXACTLY one of:
   - "Emergency" (immediate emergency care needed: severe infection, necrosis, anaphylactic rash, severe facial/eye involvement)
   - "Same-Day" (urgent medical evaluation within 24h: rapid spreading, severe pain, extensive blistering)
   - "Dermatologist Soon" (evaluation within 1-2 weeks: suspicious pigmented lesion, non-healing ulcer, persistent plaques)
   - "Routine Consultation" (standard doctor visit: mild eczema, stable acne, minor rash)
   - "Monitor" (low concern, safe to track visually over time)
4. Evaluate ABCDE pigmented lesion risk criteria if dark/pigmented macule/nevus is suspected.
5. Highlight medication safety: warnings against steroid misuse on fungal lesions, contraindications, and general non-prescription advice.
6. Provide differential diagnoses with supporting features, unfitting features, and distinguishing factors.
7. Return ONLY a valid JSON object matching this schema:

{
  "primaryCondition": "Condition Name",
  "confidence": 85,
  "severity": "Early" | "Mid" | "Extreme",
  "severityScore": 6,
  "explanation": "Clear clinical decision support summary.",
  "visualObservations": {
    "color": "Erythematous / Hyperpigmented",
    "texture": "Scaly / Papular / Smooth",
    "borders": "Well-demarcated / Irregular / Diffuse",
    "inflammation": "Low / Moderate / High",
    "lesionType": "Patch / Plaque / Papule / Macule"
  },
  "triage": {
    "level": "Emergency" | "Same-Day" | "Dermatologist Soon" | "Routine Consultation" | "Monitor",
    "score": 3,
    "redFlags": ["Rapid spreading over 48h", "Associated burning pain"],
    "escalationReason": "Moderate to high inflammation with rapid spreading warrants prompt evaluation."
  },
  "uncertaintySystem": {
    "isUncertain": false,
    "oodDetected": false,
    "reason": "",
    "confidenceSufficient": true
  },
  "abcdeAnalysis": {
    "asymmetry": "Symmetrical overall contour",
    "border": "Smooth, defined edges",
    "color": "Uniform light brown",
    "diameter": "Approx. 4mm (<6mm)",
    "evolution": "No recent reported changes",
    "riskSummary": "Low visual suspicion criteria"
  },
  "differentialDiagnoses": [
    {
      "name": "Condition 1",
      "confidence": 85,
      "description": "Brief summary",
      "supportingFeatures": ["Erythematous scaling", "Itching reported"],
      "unfittingFeatures": ["Absence of pustules"],
      "distinguishingFactors": "Dermatitis presents with diffuse margins unlike tinea annular borders."
    }
  ],
  "medicationSafety": {
    "warnings": ["Do NOT apply potent topical steroids if fungal infection is suspected."],
    "safeGeneralAdvice": ["Keep area clean and dry", "Use fragrance-free emollients"],
    "contraindications": []
  },
  "recommendations": [
    "Care step 1",
    "Care step 2"
  ],
  "adaptiveFollowUps": [
    "Did the redness expand after applying any cream?",
    "Do you have a personal or family history of psoriasis or eczema?"
  ],
  "disclaimer": "SkinScan AI is a Clinical Decision Support tool and does not provide a formal medical diagnosis. Please present this report to a licensed clinician."
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
      result = await callClaudeVision(base64Clean, anthropicKey, model || 'claude-3-5-sonnet-20241022', symptoms);
    } catch (err) {
      console.warn('Claude API failed, falling back to smart analyzer:', err.message);
    }
  }

  if (!result && activeProvider === 'gemini' && geminiKey) {
    try {
      result = await callGeminiVision(base64Clean, geminiKey, symptoms);
    } catch (err) {
      console.warn('Gemini API failed, falling back to smart analyzer:', err.message);
    }
  }

  // Fallback to local smart analyzer
  if (!result) {
    result = runSmartFallbackAnalyzer(base64Clean, symptoms);
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

