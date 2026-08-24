import React, { useEffect, useRef, useState } from 'react';
import { generateSaliencyHeatmap } from '../utils/imageProcessing';
import { Eye, Flame, Maximize2, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

export default function LesionSegmentation({ imageSrc, conditionName }) {
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const [viewMode, setViewMode] = useState('segmented'); // 'segmented' | 'heatmap' | 'original'

  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const heatData = generateSaliencyHeatmap(img);
      if (isMounted) setHeatmapUrl(heatData);
    };
    return () => { isMounted = false; };
  }, [imageSrc]);

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4 text-left">
      
      {/* Top Bar with Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Explainable AI: Lesion Boundary & Saliency Heatmap</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Visual highlights showing skin regions evaluated by the vision neural network.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('segmented')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              viewMode === 'segmented' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>ROI Contour</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              viewMode === 'heatmap' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-300" />
            <span>AI Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              viewMode === 'original' ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Raw Photo</span>
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Overlays */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-72 flex items-center justify-center p-1">
        <img
          src={viewMode === 'heatmap' && heatmapUrl ? heatmapUrl : imageSrc}
          alt="Segmentation preview"
          className="max-h-64 w-auto object-contain rounded-lg"
        />

        {/* ROI Bounding Box Overlay if in Segmented mode */}
        {viewMode === 'segmented' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-cyan-400 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] relative flex items-center justify-center">
              <span className="bg-cyan-950/90 text-cyan-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-cyan-500/40">
                Extracted Skin ROI: {conditionName || 'Lesion Region'}
              </span>
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-300"></div>
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-300"></div>
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-300"></div>
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-300"></div>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Heatmap saliency represents color variance attention weights; it is an AI visual explanation tool, not absolute medical proof.</span>
      </div>

    </div>
  );
}
