/**
 * Image processing utilities for SkinScan AI (Clinical Decision Support System):
 * - Blur detection using Laplacian Variance on grayscale pixel buffer
 * - Brightness, contrast, hair obstruction, and shadow quality analysis
 * - Lesion boundary estimation & saliency heatmap mask generation
 * - Image normalization & resizing before AI analysis
 */

/**
 * Analyzes detailed image quality metrics (blur, brightness, contrast, hair obstruction, shadows, framing)
 * @param {HTMLImageElement | HTMLCanvasElement | ImageBitmap} imgSource 
 */
export async function analyzeImageQuality(imgSource) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const targetWidth = 400;
    const scale = targetWidth / (imgSource.width || imgSource.videoWidth || 400);
    const width = Math.max(100, Math.floor((imgSource.width || 400) * scale));
    const height = Math.max(100, Math.floor((imgSource.height || 300) * scale));

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imgSource, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Grayscale conversion, Brightness & Color Saturation calculation
    const gray = new Float32Array(width * height);
    let totalBrightness = 0;
    let darkPixelCount = 0;
    let highRedPixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[i / 4] = luma;
      totalBrightness += luma;

      if (luma < 40) darkPixelCount++;
      // Redness erythema check
      if (r > g + 25 && r > b + 25) highRedPixelCount++;
    }

    const avgBrightness = totalBrightness / (width * height);

    // 2. Contrast calculation
    let varianceSum = 0;
    for (let i = 0; i < gray.length; i++) {
      varianceSum += Math.pow(gray[i] - avgBrightness, 2);
    }
    const contrast = Math.sqrt(varianceSum / gray.length);

    // 3. Laplacian Variance for Blur Detection
    let lapSum = 0;
    let lapSqSum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const lap =
          gray[idx - width] +
          gray[idx - 1] +
          gray[idx + 1] +
          gray[idx + width] -
          4 * gray[idx];

        lapSum += lap;
        lapSqSum += lap * lap;
        count++;
      }
    }

    const lapMean = count > 0 ? lapSum / count : 0;
    const lapVariance = count > 0 ? (lapSqSum / count) - (lapMean * lapMean) : 0;

    // 4. Shadow & Hair Obstruction Heuristics
    const darkRatio = darkPixelCount / (width * height);
    const hasHairObstruction = darkRatio > 0.18 && lapVariance > 120;
    const hasExcessiveShadows = contrast > 75 && darkRatio > 0.22;
    const skinRegionRatio = highRedPixelCount / (width * height);
    const hasPoorFraming = skinRegionRatio < 0.08;

    // Quality evaluations
    const isBlurry = lapVariance < 75;
    const isTooDark = avgBrightness < 45;
    const isTooBright = avgBrightness > 215;
    const isLowContrast = contrast < 22;

    const issues = [];
    if (isBlurry) issues.push("Image appears blurry or out of focus. Hold camera steady or tap screen to focus.");
    if (isTooDark) issues.push("Lighting is too dim. Move to a well-lit room or use natural daylight.");
    if (isTooBright) issues.push("Image is overexposed or washed out by flash glare.");
    if (isLowContrast) issues.push("Low detail contrast detected on skin surface.");
    if (hasHairObstruction) issues.push("Dense hair obstruction detected. Gently part hair away from lesion.");
    if (hasExcessiveShadows) issues.push("Heavy shadows across skin surface. Position light source directly overhead.");
    if (hasPoorFraming) issues.push("Lesion seems too far or poorly framed. Move camera 4-6 inches closer to skin.");

    let qualityScore = 100;
    if (isBlurry) qualityScore -= 35;
    if (isTooDark) qualityScore -= 20;
    if (isTooBright) qualityScore -= 20;
    if (isLowContrast) qualityScore -= 15;
    if (hasHairObstruction) qualityScore -= 15;
    if (hasExcessiveShadows) qualityScore -= 15;
    if (hasPoorFraming) qualityScore -= 10;

    if (lapVariance > 220) qualityScore = Math.min(100, qualityScore + 10);
    qualityScore = Math.max(10, Math.min(100, Math.round(qualityScore)));

    resolve({
      blurScore: Math.round(lapVariance),
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      isBlurry,
      isTooDark,
      isTooBright,
      isLowContrast,
      hasHairObstruction,
      hasExcessiveShadows,
      hasPoorFraming,
      qualityScore,
      issues
    });
  });
}

/**
 * Generates an explainable AI Saliency Heatmap Canvas Data URL
 * Simulates visual attention overlay highlighting color variance & erythema zones
 */
export function generateSaliencyHeatmap(imgSource) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = imgSource.width || 400;
  const height = imgSource.height || 300;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(imgSource, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Create heatmap overlay buffer
  const heatCanvas = document.createElement('canvas');
  heatCanvas.width = width;
  heatCanvas.height = height;
  const heatCtx = heatCanvas.getContext('2d');
  const heatData = heatCtx.createImageData(width, height);
  const hPixels = heatData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Compute erythema / saliency weight
    const redDominance = Math.max(0, r - (g + b) / 2);
    const intensity = Math.min(255, redDominance * 2.2);

    if (intensity > 30) {
      // Heatmap Jet palette mapping (Blue -> Green -> Yellow -> Red)
      hPixels[i] = Math.min(255, intensity * 1.5);     // Red
      hPixels[i + 1] = Math.max(0, 255 - intensity);   // Green
      hPixels[i + 2] = Math.max(0, 150 - intensity);   // Blue
      hPixels[i + 3] = Math.min(180, intensity * 0.7); // Alpha opacity
    } else {
      hPixels[i + 3] = 0; // Transparent
    }
  }

  heatCtx.putImageData(heatData, 0, 0);

  // Composite heatmap on top of original image
  ctx.globalAlpha = 0.55;
  ctx.drawImage(heatCanvas, 0, 0);
  ctx.globalAlpha = 1.0;

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Normalizes and resizes image for optimal AI Vision submission
 */
export function processImageForAI(imgSource, options = {}) {
  const {
    maxDimension = 1024,
    brightnessAdj = 0,
    contrastAdj = 0,
    quality = 0.88
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let w = imgSource.width || imgSource.videoWidth || 800;
  let h = imgSource.height || imgSource.videoHeight || 600;

  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  canvas.width = w;
  canvas.height = h;

  if (brightnessAdj !== 0 || contrastAdj !== 0) {
    const b = 100 + brightnessAdj;
    const c = 100 + contrastAdj;
    ctx.filter = `brightness(${b}%) contrast(${c}%)`;
  }

  ctx.drawImage(imgSource, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Crops a specific region from an image canvas
 */
export function cropSkinRegion(imgSource, cropRect) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = Math.max(50, cropRect.width);
  canvas.height = Math.max(50, cropRect.height);

  ctx.drawImage(
    imgSource,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    cropRect.width,
    cropRect.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

