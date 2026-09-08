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

    for (let i = 0; i < data.length; i += 4) {
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
    }

    const redRatio = skinPixelCount > 0 ? redMarkPixelCount / skinPixelCount : 0;
    const isRedDetected = redRatio > 0.03;

    setTimeout(() => {
      setResult({
        isRedDetected,
        skinPixelCount,
        redMarkPixelCount,
        percentage: (redRatio * 100).toFixed(1),
        message: isRedDetected
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
          <span>Real-time Color Matrix Analysis</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
          🖐️ Skin Redness & Erythema Checker
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
          Upload a photo of your hand or skin area. The pixel algorithm will analyze skin tones and flag erythema, rash, or red spot concentration.
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
                <p className="text-xs font-bold text-cyan-400">Scanning skin pixels & calculating RGB redness differential...</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-2xl border flex items-center gap-4 text-left transition-all ${
                    result.isRedDetected
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  {result.isRedDetected ? (
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
                    <p className="text-xs opacity-80 mt-0.5">
                      Flagged redness ratio: <strong>{result.percentage}%</strong> of detected skin surface.
                    </p>
                  </div>
                </div>

                {/* Pixel Breakdown Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Analyzed Skin Pixels</span>
                    <span className="text-sm font-extrabold text-slate-100">{result.skinPixelCount.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Red Flagged Pixels</span>
                    <span className={`text-sm font-extrabold ${result.isRedDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {result.redMarkPixelCount.toLocaleString()}
                    </span>
                  </div>
                </div>
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
