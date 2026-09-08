/**
 * SkinScan AI - Browser-based Hybrid CNN Inference Engine (MobileNetV3 ONNX)
 * Performs deep feature extraction & classification directly in browser via ONNX Runtime Web
 */

// Class index mapping matching HAM10000 7-class schema
export const HAM10000_CLASS_KEYS = [
  'melanocytic_nevi',
  'melanoma',
  'benign_keratosis',
  'basal_cell_carcinoma',
  'actinic_keratoses',
  'vascular_lesion',
  'dermatofibroma'
];

let onnxSession = null;
let isSessionLoading = false;

/**
 * Initializes ONNX Runtime session if model artifact exists
 */
export async function initCnnModel() {
  if (onnxSession) return onnxSession;
  if (isSessionLoading) return null;

  try {
    isSessionLoading = true;
    const getOrt = new Function('return import("onnxruntime-web")');
    const ort = await getOrt().catch(() => null);
    if (ort && ort.InferenceSession) {
      onnxSession = await ort.InferenceSession.create('/models/mobilenet_skin.onnx', {
        executionProviders: ['wasm']
      });
      console.log('✅ MobileNetV3 ONNX Model loaded successfully into WebAssembly runtime.');
      return onnxSession;
    }
  } catch (err) {
    console.warn('ℹ️ ONNX model file pending or WebAssembly runtime not loaded. Using fallback feature ensemble.', err?.message || err);
  } finally {
    isSessionLoading = false;
  }
  return null;
}

/**
 * Preprocesses ImageData into Float32 tensor for MobileNetV3 (384x384, RGB normalized)
 */
export function preprocessImageForCnn(imgData) {
  const { data, width, height } = imgData;
  const floatArr = new Float32Array(3 * 384 * 384);
  const scaleX = width / 384;
  const scaleY = height / 384;

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let y = 0; y < 384; y++) {
    for (let x = 0; x < 384; x++) {
      const origX = Math.floor(x * scaleX);
      const origY = Math.floor(y * scaleY);
      const srcIdx = (origY * width + origX) * 4;

      const r = data[srcIdx] / 255.0;
      const g = data[srcIdx + 1] / 255.0;
      const b = data[srcIdx + 2] / 255.0;

      const rIdx = y * 384 + x;
      const gIdx = 384 * 384 + rIdx;
      const bIdx = 2 * 384 * 384 + rIdx;

      floatArr[rIdx] = (r - mean[0]) / std[0];
      floatArr[gIdx] = (g - mean[1]) / std[1];
      floatArr[bIdx] = (b - mean[2]) / std[2];
    }
  }

  return floatArr;
}

/**
 * Runs deep CNN inference on an image element or ImageData
 */
export async function runCnnInference(imgData, visualFeatures = {}) {
  const session = await initCnnModel();

  if (session && imgData && imgData.data) {
    try {
      const getOrt = new Function('return import("onnxruntime-web")');
      const ort = await getOrt();
      const tensorData = preprocessImageForCnn(imgData);
      const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 384, 384]);
      
      const feeds = {};
      feeds[session.inputNames[0]] = inputTensor;
      const results = await session.run(feeds);
      const outputTensor = results[session.outputNames[0]];
      const rawLogits = Array.from(outputTensor.data);
      
      const maxLogit = Math.max(...rawLogits);
      const expLogits = rawLogits.map(l => Math.exp(l - maxLogit));
      const expSum = expLogits.reduce((a, b) => a + b, 0);
      const probs = expLogits.map(e => e / expSum);

      const classProbabilities = {};
      HAM10000_CLASS_KEYS.forEach((key, idx) => {
        classProbabilities[key] = Math.round((probs[idx] || 0) * 1000) / 1000;
      });

      return {
        isCnnAvailable: true,
        classProbabilities,
        topConfidence: Math.max(...probs)
      };
    } catch (err) {
      console.warn('CNN Inference runtime fallback:', err);
    }
  }

  // Balanced Feature Ensemble Fallback
  const erythema = visualFeatures.erythemaRatio || 0;
  const dark = visualFeatures.pigmentationRatio || 0;
  const bii = visualFeatures.borderIrregularityIndex || 1.0;
  const contrast = visualFeatures.glcm?.contrast || 0.1;
  const scale = visualFeatures.scaleRatio || 0;

  const probs = {
    melanocytic_nevi: 0.14 + (dark > 0.035 ? 0.35 : 0),
    melanoma: 0.10 + (dark > 0.04 && bii > 1.35 ? 0.45 : 0),
    benign_keratosis: 0.14 + (contrast > 0.35 || scale > 0.02 ? 0.30 : 0),
    basal_cell_carcinoma: 0.14 + (erythema > 0.25 && dark < 0.02 ? 0.25 : 0),
    actinic_keratoses: 0.14 + (erythema > 0.30 && scale > 0.03 ? 0.30 : 0),
    vascular_lesion: 0.14 + (erythema > 0.35 ? 0.35 : 0),
    dermatofibroma: 0.14 + (bii < 1.15 && dark > 0.05 ? 0.25 : 0)
  };

  const total = Object.values(probs).reduce((a, b) => a + b, 0) || 1;
  Object.keys(probs).forEach(k => {
    probs[k] = Math.round((probs[k] / total) * 1000) / 1000;
  });

  return {
    isCnnAvailable: false,
    classProbabilities: probs,
    topConfidence: Math.max(...Object.values(probs))
  };
}
