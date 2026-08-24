import React, { useState } from 'react';
import { Columns, Sliders, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';

export default function ImageComparer({ scanA, scanB, onClose }) {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [mode, setMode] = useState('split'); // 'split' | 'side'

  if (!scanA || !scanB) return null;

  const dateA = new Date(scanA.timestamp).toLocaleDateString();
  const dateB = new Date(scanB.timestamp).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-slate-700 space-y-5 text-left relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>Longitudinal Lesion Comparison</span>
            </h3>
            <p className="text-xs text-slate-400">Comparing scan from {dateA} vs {dateB}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMode('split')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  mode === 'split' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split Overlay
              </button>
              <button
                onClick={() => setMode('side')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  mode === 'side' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Side-by-Side
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport */}
        {mode === 'split' ? (
          <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 select-none">
            {/* Background image B (Newer) */}
            <img
              src={scanB.thumbnail || scanB.image}
              alt="Scan B"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Foreground image A (Older cropped by slider) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-cyan-400 shadow-[0_0_15px_#06b6d4]"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={scanA.thumbnail || scanA.image}
                alt="Scan A"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%' }}
              />
              <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-cyan-300 font-mono border border-cyan-500/30">
                Earlier Scan ({dateA})
              </span>
            </div>

            <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-teal-300 font-mono border border-teal-500/30">
              Recent Scan ({dateB})
            </span>

            {/* Interactive Slider Input Overlay */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-cyan-300 block">Baseline Scan ({dateA})</span>
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={scanA.thumbnail || scanA.image} alt="Scan A" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {scanA.primaryCondition} ({scanA.confidence}%) • Severity: {scanA.severity}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-teal-300 block">Follow-up Scan ({dateB})</span>
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={scanB.thumbnail || scanB.image} alt="Scan B" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                {scanB.primaryCondition} ({scanB.confidence}%) • Severity: {scanB.severity}
              </p>
            </div>
          </div>
        )}

        {/* Change Observations */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
          <span className="font-bold text-slate-100 block">Progression Analysis Observation:</span>
          <p className="text-slate-300 leading-relaxed">
            The analyzed affected area shows visible margin progression tracking over time. Clinical advice: monitor for expanding erythema boundaries or texture thickening between follow-up intervals.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800"
        >
          Close Comparison View
        </button>

      </div>
    </div>
  );
}
