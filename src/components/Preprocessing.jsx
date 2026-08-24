import React, { useState } from 'react';
import { processImageForAI } from '../utils/imageProcessing';
import { Sliders, Sun, Contrast, RotateCcw, Check, ArrowLeft } from 'lucide-react';

export default function Preprocessing({ imageSrc, onCancel, onSaveAdjusted }) {
  const [brightness, setBrightness] = useState(0); // -50 to 50
  const [contrast, setContrast] = useState(0);     // -50 to 50

  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
  };

  const handleApply = () => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const processed = processImageForAI(img, {
        brightnessAdj: brightness,
        contrastAdj: contrast,
        maxDimension: 1200
      });
      onSaveAdjusted(processed);
    };
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-5 p-4 my-4 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Image Preprocessing & Normalization</span>
        </h3>
        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800"
          title="Reset Sliders"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Preview Canvas Filter Container */}
      <div className="w-full relative rounded-2xl overflow-hidden glass-card border border-slate-700 bg-slate-950/90 max-h-72 flex items-center justify-center p-2">
        <img
          src={imageSrc}
          alt="Preprocessing Preview"
          className="max-h-64 w-auto object-contain rounded-xl transition-all"
          style={{
            filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`
          }}
        />
      </div>

      {/* Adjustment Sliders */}
      <div className="w-full glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Brightness Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Brightness Normalization</span>
            </span>
            <span className="font-mono text-cyan-400">{brightness > 0 ? `+${brightness}` : brightness}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Contrast className="w-4 h-4 text-cyan-400" />
              <span>Contrast Normalization</span>
            </span>
            <span className="font-mono text-cyan-400">{contrast > 0 ? `+${contrast}` : contrast}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center gap-3">
        <button
          onClick={onCancel}
          className="w-1/2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-800"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Check className="w-4 h-4" />
          <span>Apply & Save</span>
        </button>
      </div>

    </div>
  );
}
