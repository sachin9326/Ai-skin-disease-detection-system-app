/**
 * Utility functions for dynamic confidence color styling
 * - < 50%: Red (rose)
 * - 50% - 70%: Yellow (amber)
 * - > 70%: Green (emerald)
 */

export const getConfidenceBadgeStyle = (confidenceVal) => {
  const conf = parseFloat(confidenceVal);
  if (isNaN(conf)) return 'bg-slate-800 text-slate-300 border-slate-700';
  if (conf < 50) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/10';
  } else if (conf <= 70) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10';
  } else {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10';
  }
};

export const getConfidenceTextColor = (confidenceVal) => {
  const conf = parseFloat(confidenceVal);
  if (isNaN(conf)) return 'text-slate-300';
  if (conf < 50) return 'text-rose-400';
  if (conf <= 70) return 'text-amber-400';
  return 'text-emerald-400';
};

export const getConfidenceBarColor = (confidenceVal) => {
  const conf = parseFloat(confidenceVal);
  if (isNaN(conf)) return 'bg-slate-500';
  if (conf < 50) return 'bg-rose-500';
  if (conf <= 70) return 'bg-amber-400';
  return 'bg-emerald-500';
};
