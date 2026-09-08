import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, BarChart2, Zap, Play, Layers, Database, Activity, Sparkles } from 'lucide-react';
import { runBenchmarkSuite, getEmpiricalEvaluationReport } from '../utils/validationMetrics';

export default function ValidationDashboard() {
  const [viewMode, setViewMode] = useState('empirical'); // 'empirical' | 'benchmark'
  const [metrics, setMetrics] = useState(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  useEffect(() => {
    // Load empirical evaluation report by default
    setMetrics(getEmpiricalEvaluationReport());
  }, []);

  const handleToggleMode = (mode) => {
    setViewMode(mode);
    if (mode === 'empirical') {
      setMetrics(getEmpiricalEvaluationReport());
    } else {
      setMetrics(runBenchmarkSuite());
    }
  };

  const handleRunBenchmark = () => {
    setIsRunningBenchmark(true);
    setTimeout(() => {
      setMetrics(runBenchmarkSuite());
      setViewMode('benchmark');
      setIsRunningBenchmark(false);
    }, 400);
  };

  if (!metrics) return null;

  return (
    <div className="glass-card-premium p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-6 text-left shadow-2xl relative overflow-hidden bg-slate-900/90">
      {/* Background ambient light orb */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
            <BarChart2 className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-400 border-2 border-slate-950"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-100 tracking-tight">HAM10000 / ISIC Model Validation Metrics</h3>
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-xs">
                Patient-Level Split
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Empirical 7-class clinical validation, patient-group lesion splitting & safety audit</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex items-center text-xs shadow-inner">
            <button
              onClick={() => handleToggleMode('empirical')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'empirical'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>ISIC 2018 Test Set (1,512)</span>
            </button>

            <button
              onClick={() => handleToggleMode('benchmark')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'benchmark'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>50-Case Suite</span>
            </button>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunningBenchmark}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            {isRunningBenchmark ? <Zap className="w-4 h-4 animate-spin text-slate-950" /> : <Play className="w-4 h-4 text-slate-950 fill-current" />}
            <span>Run Benchmark</span>
          </button>
        </div>
      </div>

      {/* Mode Status Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300 font-mono text-[11px]">
            {viewMode === 'empirical'
              ? `Trained on HAM10000 (7,991 train / 2,024 val, 0 lesion_id overlap) | Holdout Evaluation: ISIC2018 Task 3 (1,512 images)`
              : `Simulated Clinical Benchmark: 50 Ground-Truth Curated Cases`}
          </span>
        </div>
        {metrics.valMacroAuc && (
          <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 self-end sm:self-auto">
            <span className="text-slate-400">Val AUC: <strong className="text-teal-300 font-bold">{metrics.valMacroAuc.toFixed(4)}</strong></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Test AUC: <strong className="text-cyan-300 font-bold">{metrics.testMacroAuc.toFixed(4)}</strong></span>
          </div>
        )}
      </div>

      {/* Accuracy KPI Grid */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5 hover:border-cyan-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Overall Accuracy</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight">
            {(metrics.overallAccuracy * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400 block">
            {viewMode === 'empirical' ? '1,512 ISIC Holdout Test Cases' : '50 Benchmark Cases'}
          </span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5 hover:border-cyan-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Macro F1-Score</span>
            <Layers className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-teal-300 font-mono tracking-tight">
            {metrics.macroF1.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-400 block">Unweighted Mean (7 classes)</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5 hover:border-rose-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Melanoma Recall</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono tracking-tight">
            {(metrics.melanomaRecall * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-rose-300 block font-medium">Sensitivity Threshold ≥ 80.0%</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1.5 hover:border-emerald-500/50 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Melanoma Safety Flag</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {metrics.melanomaSafetyPassed ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <span className="font-black text-emerald-300 text-base tracking-wide">PASSED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                <span className="font-black text-amber-300 text-base tracking-wide">WARNING</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block">Safety Protocol Active</span>
        </div>
      </div>

      {/* Per-Class Metrics Table */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Per-Class Clinical Diagnostics Performance</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Precision / Sensitivity / Specificity Breakdown</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Class / Diagnosis</th>
                <th className="p-3 text-center">Code</th>
                <th className="p-3 text-right">Precision</th>
                <th className="p-3 text-right">Recall (Sens)</th>
                <th className="p-3 text-right">Specificity</th>
                <th className="p-3 text-right">F1-Score</th>
                <th className="p-3 text-right">AUC-ROC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-slate-200">
              {metrics.perClass.map((cls) => {
                const isMel = cls.classId === 'melanoma';
                return (
                  <tr key={cls.classId} className={isMel ? 'bg-rose-500/10 font-bold border-l-2 border-l-rose-500' : 'hover:bg-slate-900/60 transition-colors'}>
                    <td className="p-3 font-sans font-semibold text-slate-100 flex items-center gap-2">
                      {isMel ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse shrink-0"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shrink-0"></span>
                      )}
                      <span>{cls.name}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        isMel ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {cls.code}
                      </span>
                    </td>
                    <td className="p-3 text-right text-teal-300 font-bold">{(cls.precision * 100).toFixed(1)}%</td>
                    <td className={`p-3 text-right font-black ${isMel ? 'text-rose-300' : 'text-cyan-300'}`}>
                      {(cls.recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-slate-400">{(cls.specificity * 100).toFixed(1)}%</td>
                    <td className="p-3 text-right text-emerald-300 font-bold">{cls.f1Score.toFixed(3)}</td>
                    <td className="p-3 text-right text-amber-300 font-bold">{cls.aucRoc.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7x7 Confusion Matrix */}
      <div className="relative z-10 space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>7 × 7 Empirical Confusion Matrix (Predicted vs Actual)</span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Rows: Ground Truth | Columns: Model Prediction</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner">
          <div className="grid grid-cols-8 gap-1.5 text-[11px] font-mono text-center min-w-[550px]">
            {/* Header row */}
            <div className="p-2 font-sans text-slate-400 font-bold text-[10px] flex items-center justify-center">Act \ Pred</div>
            {metrics.classes.map(c => (
              <div key={c.code} className="p-2 font-extrabold text-slate-200 bg-slate-900 rounded-xl border border-slate-800 shadow-xs">{c.code}</div>
            ))}

            {/* Matrix rows */}
            {metrics.confusionMatrix.map((row, rIdx) => (
              <React.Fragment key={rIdx}>
                <div className="p-2 font-extrabold text-slate-200 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-[10px] shadow-xs">
                  {metrics.classes[rIdx].code}
                </div>
                {row.map((val, cIdx) => {
                  const isDiagonal = rIdx === cIdx;
                  return (
                    <div
                      key={cIdx}
                      className={`p-2 rounded-xl font-black transition-all flex items-center justify-center ${
                        isDiagonal
                          ? val > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10' : 'bg-slate-900 text-slate-600 border border-slate-800'
                          : val > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-900/60 text-slate-700 border border-slate-900'
                      }`}
                    >
                      {val}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



