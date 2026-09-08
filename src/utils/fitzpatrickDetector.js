/**
 * Fitzpatrick Skin Tone Auto-Detection & Threshold Calibration Module
 * Analyzes skin background lightness (L*a*b*), melanin index, and RGB distributions
 * to classify skin tones into Fitzpatrick Scale Types I to VI and calibrate color-based diagnostic thresholds.
 */

export function detectFitzpatrickSkinType(imgDataOrStats) {
  let avgL = 62; // Default Medium/Fair
  let avgA = 15;
  let avgB = 18;
  let peripheralLumaEstimate = null;

  if (imgDataOrStats && imgDataOrStats.avgR !== undefined) {
    const { avgR: rVal, avgG: gVal, avgB: bVal } = imgDataOrStats;
    // Standard RGB to CIE L*a*b* approximation
    avgL = 0.2126 * rVal + 0.7152 * gVal + 0.0722 * bVal;
    avgA = (rVal - gVal) * 0.6;
    avgB = (gVal - bVal) * 0.4;
  }

  if (imgDataOrStats && typeof imgDataOrStats.peripheralLuma === 'number') {
    peripheralLumaEstimate = imgDataOrStats.peripheralLuma;
    // Base skin luma estimate primarily on background/peripheral skin
    avgL = peripheralLumaEstimate;
  }

  let type = 'Type III';
  let name = 'Medium Fair / Olive White';
  let description = 'Burns moderately, tans gradually to light brown.';
  let typeNum = 3;

  if (avgL > 76) {
    type = 'Type I';
    name = 'Very Light / Pale White';
    description = 'Always burns easily in sun, rarely tans. Extremely UV sensitive.';
    typeNum = 1;
  } else if (avgL > 68) {
    type = 'Type II';
    name = 'Fair / White';
    description = 'Burns easily in sun, tans minimally. High UV sensitivity.';
    typeNum = 2;
  } else if (avgL > 58) {
    type = 'Type III';
    name = 'Medium Fair / Olive White';
    description = 'Burns moderately, tans gradually to light brown.';
    typeNum = 3;
  } else if (avgL > 46) {
    type = 'Type IV';
    name = 'Olive / Moderate Brown';
    description = 'Burns minimally, always tans well to moderate brown.';
    typeNum = 4;
  } else if (avgL > 34) {
    type = 'Type V';
    name = 'Brown / Dark Brown';
    description = 'Rarely burns, tans profusely to dark brown. High melanin density.';
    typeNum = 5;
  } else {
    type = 'Type VI';
    name = 'Deep Dark Brown / Black';
    description = 'Never burns, deeply pigmented melanin. Erythema manifests as violaceous/dark brown induration.';
    typeNum = 6;
  }

  // Calibrated diagnostic thresholds based on Fitzpatrick tone and relative peripheral background
  const calibratedThresholds = {
    // On darker skin (Types IV-VI), erythema appears violaceous/purplish rather than bright red
    erythemaMinDelta: typeNum >= 5 ? 8 : (typeNum >= 4 ? 12 : 18),
    // On darker skin, dark mole thresholds adjust to prevent false positives from normal background melanin
    darkPigmentLumaMax: typeNum >= 6 ? 32 : (typeNum >= 5 ? 42 : (typeNum >= 4 ? 55 : 75)),
    // Relative ratio threshold: lesion pixel must be darker than surrounding skin by this factor
    relativeDarkFactor: typeNum >= 5 ? 0.70 : 0.65,
    // Scale visibility factor (scales appear silvery white on darker skin)
    scaleBrightnessMin: typeNum >= 4 ? 150 : 165,
    peripheralLumaEstimate: peripheralLumaEstimate ?? avgL,
    fitzpatrickType: type,
    fitzpatrickName: name,
    fitzpatrickDescription: description,
    typeNum
  };

  return calibratedThresholds;
}
