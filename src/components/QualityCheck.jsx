import React, { useEffect, useState } from 'react';
import { analyzeImageQuality } from '../utils/imageProcessing';
import { AlertTriangle, CheckCircle2, RefreshCw, ArrowRight, Sun, Sliders, Camera, HelpCircle, Scissors } from 'lucide-react';

export default function QualityCheck({ imageSrc, onRetake, onProceed, onOpenPreprocessing }) {
  const [metrics, setMetrics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const res = await analyzeImageQuality(img);
      if (isMounted) {
        setMetrics(res);
        setIsAnalyzing(false);
      }
    };
    return () => { isMounted = false; };
  }, [imageSrc]);

  if (isAnalyzing) {
    return (
      <div className="w-full max-w-lg mx-auto glass-card p-8 rounded-3xl text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Evaluating Image Quality...</h3>
        <p className="text-xs text-slate-400">Checking focus sharpness, hair obstruction, shadow uniformness, and framing.</p>
      </div>
    );
  }

  const isPass = metrics && metrics.qualityScore >= 60 && !metrics.isBlurry;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-5 p-4 my-4 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-100">Image Quality Check</h2>
        <p className="text-xs text-slate-400">Verifying photo clarity before clinical AI vision processing.</p>
      </div>

      {/* Image Preview & Quality Badge */}
      <div className="w-full relative rounded-2xl overflow-hidden glass-card border border-slate-700 bg-slate-950/80 shadow-xl max-h-80 flex items-center justify-center p-2">
        <img
          src={imageSrc}
          alt="Captured skin preview"
          className="max-h-72 w-auto object-contain rounded-xl"
        />

        {/* Floating Quality Score Tag */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg border ${
          isPass 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
            : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
        }`}>
          {isPass ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Clarity Passed ({metrics?.qualityScore}%)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Quality Alert ({metrics?.qualityScore}%)</span>
            </>
          )}
        </div>
      </div>

      {/* Detailed Metrics Panel */}
      <div className="w-full glass-card p-4 rounded-2xl border border-slate-800 space-y-2.5 text-left">
        
        <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-800 pb-2.5">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[11px]">Sharpness (Laplacian):</span>
            <span className={`font-mono font-semibold ${metrics?.isBlurry ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metrics?.blurScore} {metrics?.isBlurry ? '(Blurry)' : '(Sharp)'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[11px]">Illumination Level:</span>
            <span className="font-mono font-semibold text-slate-200">
              {metrics?.brightness} / 255
            </span>
          </div>
        </div>

        {/* Quality Alerts & Retake Guide */}
        {metrics?.issues && metrics.issues.length > 0 ? (
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-300 space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Photography Improvements Needed:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90">
              {metrics.issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Optimal image quality! High focus and clear lighting for clinical decision support.</span>
          </div>
        )}

        {/* How to Take Better Skin Photos Guide */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
          <span className="font-bold text-cyan-300 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dermatology Photo Tips:</span>
          </span>
          <p className="text-slate-400 leading-normal">
            1. Hold camera 4-6 inches from skin. 2. Ensure bright indirect sunlight or overhead room light. 3. Tap to focus directly on lesion border.
          </p>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onRetake}
          className="w-full sm:w-1/3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Retake</span>
        </button>

        {onOpenPreprocessing && (
          <button
            onClick={onOpenPreprocessing}
            className="w-full sm:w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Adjust</span>
          </button>
        )}

        <button
          onClick={() => onProceed(imageSrc)}
          className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

