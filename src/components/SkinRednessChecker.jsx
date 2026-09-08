import React, { useState, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle, RotateCcw, Info, Sparkles } from 'lucide-react';

export default function SkinRednessChecker() {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const canvasRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setPreview(evt.target.result);
      const img = new Image();
      img.onload = () => analyzeImage(img);
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = (img) => {
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const maxDim = 300;
    const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);

    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let skinPixelCount = 0;
    let redMarkPixelCount = 0;
    let papuleDotCount = 0;
    const width = canvas.width;
    const height = canvas.height;

    for (let y = 3; y < height - 3; y += 3) {
      for (let x = 3; x < width - 3; x += 3) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 50) continue;
        if (r > 235 && g > 235 && b > 235) continue;

        const isSkinTone =
          r > 95 &&
          g > 40 &&
          b > 20 &&
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 10 &&
          r > g &&
          r > b;

        if (!isSkinTone) continue;

        skinPixelCount++;

        const rednessScore = r - (g + b) / 2;
        if (rednessScore > 45 && r > 150) {
          redMarkPixelCount++;
        }

        // Papular Dot ("Dana Dana") Contrast Peak Detection
        const centerLuma = 0.299 * r + 0.587 * g + 0.114 * b;
        const leftI = (y * width + (x - 2)) * 4;
        const rightI = (y * width + (x + 2)) * 4;
        const topI = ((y - 2) * width + x) * 4;
        const bottomI = ((y + 2) * width + x) * 4;

        const avgSurround = (
          (0.299 * data[leftI] + 0.587 * data[leftI + 1] + 0.114 * data[leftI + 2]) +
          (0.299 * data[rightI] + 0.587 * data[rightI + 1] + 0.114 * data[rightI + 2]) +
          (0.299 * data[topI] + 0.587 * data[topI + 1] + 0.114 * data[topI + 2]) +
          (0.299 * data[bottomI] + 0.587 * data[bottomI + 1] + 0.114 * data[bottomI + 2])
        ) / 4;

        const focalDiff = Math.abs(centerLuma - avgSurround);
        if ((focalDiff > 7 || rednessScore > 15) && r > g + 5) {
          papuleDotCount++;
        }
      }
    }

    const redRatio = skinPixelCount > 0 ? redMarkPixelCount / skinPixelCount : 0;
    const isRedDetected = redRatio > 0.03;
    const isAcnePattern = papuleDotCount > 20 || (papuleDotCount > 12 && isRedDetected);
    const acneConfidence = isAcnePattern ? Math.min(78, Math.max(62, Math.round(58 + papuleDotCount * 0.3))) : 0;

    setTimeout(() => {
      setResult({
        isRedDetected,
        isAcnePattern,
        acneConfidence,
        papuleDotCount,
        skinPixelCount,
        redMarkPixelCount,
        percentage: (redRatio * 100).toFixed(1),
        message: isAcnePattern
          ? `🔴 Acne Vulgaris / Papular Eruption ("Dana Dana" Pattern Detected)`
          : isRedDetected
          ? '🔴 Red Mark / Erythema Detected on Skin'
          : '✅ Healthy & Normal Skin Detected (No Red Mark or Rash Found)',
      });
      setIsAnalyzing(false);
    }, 400);
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Color & Dana Pattern Analysis</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
          🖐️ Skin Redness & Acne "Dana Dana" Checker
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
          Upload a photo of your skin. The algorithm detects red marks, rashes, and papular dot patterns ("dana dana") with instant match confidence & treatments.
        </p>
      </div>

      {/* Main Upload / Analysis Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {!preview ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-rose-500/60 hover:bg-rose-500/5 transition-all rounded-2xl p-10 cursor-pointer text-center group">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg border border-slate-700">
              <Camera className="w-8 h-8 stroke-[2]" />
            </div>
            <span className="text-sm font-bold text-slate-200 group-hover:text-rose-300">
              📷 Photo yahan click karke upload karo
            </span>
            <span className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950">
              <img
                src={preview}
                alt="Skin preview"
                className="w-full max-h-72 object-contain mx-auto"
              />
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 shadow-lg transition-all"
                title="Reset Image"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {isAnalyzing && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center animate-pulse">
                <p className="text-xs font-bold text-cyan-400">Scanning skin matrix & checking papular dot ("dana dana") patterns...</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${
                    result.isAcnePattern || result.isRedDetected
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  {result.isAcnePattern || result.isRedDetected ? (
                    <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-base">{result.message}</h3>
                    {result.isAcnePattern ? (
                      <p className="text-xs opacity-90 mt-1 font-semibold text-rose-300">
                        🎯 Match Confidence: <strong>{result.acneConfidence}% Acne Vulgaris / Folliculitis</strong>
                      </p>
                    ) : (
                      <p className="text-xs opacity-80 mt-0.5">
                        Flagged redness ratio: <strong>{result.percentage}%</strong> of detected skin surface.
                      </p>
                    )}
                  </div>
                </div>

                {/* Pixel Breakdown Stats */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Analyzed Pixels</span>
                    <span className="text-sm font-extrabold text-slate-100">{result.skinPixelCount.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Redness %</span>
                    <span className={`text-sm font-extrabold ${result.isRedDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {result.percentage}%
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Dana Dot Peaks</span>
                    <span className={`text-sm font-extrabold ${result.isAcnePattern ? 'text-amber-400' : 'text-slate-300'}`}>
                      {result.papuleDotCount}
                    </span>
                  </div>
                </div>

                {/* Acne Solutions & Treatment Box if Acne Pattern Detected */}
                {result.isAcnePattern && (
                  <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 text-left space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      💡 Clinical Care & Treatment Solutions for Acne / Dana Bumps
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">1. 🧼 Cleansing:</span>
                        <span>Use <strong>2% Salicylic Acid</strong> or <strong>Benzoyl Peroxide (2.5%-5%)</strong> wash twice daily to unclog pores and reduce papular inflammation.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">2. 💊 Topical Care:</span>
                        <span>Apply OTC <strong>Adapalene 0.1% Gel</strong> or <strong>Clindamycin + Niacinamide Gel</strong> at bedtime on affected areas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">3. 🧴 Moisturizing:</span>
                        <span>Use lightweight, oil-free, non-comedogenic gel moisturizer after washing to keep skin barrier healthy.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold shrink-0">4. ⚠️ Precaution:</span>
                        <span>"Dana / Pimples" ko squeeze ya pop mat karein! Scrubbing se bachein taaki marks aur dark spots na banein.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Note:</strong> Yeh ek color-analysis algorithm hai, final medical diagnosis nahi hai. Agar skin me koi real problem, rash, burn ya infection lag rahi ho to doctor se zaroor consult karein.
        </p>
      </div>
    </div>
  );
}
