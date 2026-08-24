import React from 'react';
import { AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-slate-900/95 border-b border-cyan-500/20 text-slate-300 px-4 py-2.5 text-xs sm:text-sm shadow-md backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-100 font-semibold">Medical Disclaimer:</strong> SkinScan AI is an AI analysis estimate tool, not a certified medical device. For diagnosis and treatment, consult a licensed dermatologist.
          </span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 text-slate-400 text-xs">
          <div className="flex items-center gap-1 text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
            <Lock className="w-3 h-3" />
            <span>Privacy-First</span>
          </div>
          <div className="flex items-center gap-1 text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/40">
            <ShieldCheck className="w-3 h-3" />
            <span>In-Memory Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
