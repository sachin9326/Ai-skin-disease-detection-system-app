import React, { useEffect, useState } from 'react';
import LesionSegmentation from './LesionSegmentation';
import { 
  Activity, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, 
  MapPin, BookmarkCheck, Share2, ArrowLeft, Info, Stethoscope, FileText,
  AlertCircle, ShieldCheck, Flame, Layers, Download, Check, Clock,
  Eye, Microscope, Zap, TrendingUp, BarChart2, Siren
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AnalysisView({ 
  isLoading, 
  analysisData, 
  imageSrc, 
  onSaveToHistory, 
  isSaved, 
  onFindDermatologist, 
  onNewScan 
}) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [showCaseSummaryModal, setShowCaseSummaryModal] = useState(false);

  const loadingMessages = [
    "Preprocessing skin surface & color spectrum...",
    "Evaluating risk triage and red flag indicators...",
    "Scanning visual border geometry & ABCDE criteria...",
    "Evaluating model uncertainty & OOD confidence boundaries...",
    "Compiling Clinical Decision Support report..."
  ];

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1200);
      return () => clearInterval(interval);
    } else if (analysisData && !analysisData?.uncertaintySystem?.isUncertain) {
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#0d9488', '#3b82f6']
        });
      } catch (e) {}
    }
  }, [isLoading, analysisData]);

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[450px] p-6 text-center space-y-6">
        
        {/* Animated Scanner Display */}
        <div className="relative w-64 h-64 rounded-3xl overflow-hidden glass-card border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex items-center justify-center">
          <img
            src={imageSrc}
            alt="Scanning target"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-scan-laser"></div>
          
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>Analyzing Multimodal Clinical Data...</span>
          </div>
          <p className="text-xs text-slate-300 font-mono h-5">
            {loadingMessages[loadingStep]}
          </p>
        </div>

      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 my-8 shadow-xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Unable to Display Analysis Report</h3>
        <p className="text-xs text-slate-400">The feature extraction completed with non-standard parameters. Please try scanning another image.</p>
        <button
          onClick={onNewScan}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black cursor-pointer"
        >
          Perform New Scan
        </button>
      </div>
    );
  }

  const {
    primaryCondition,
    confidence,
    severity = 'Mid',
    explanation,
    visualObservations = {},
    triage = {},
    uncertaintySystem = {},
    abcdeAnalysis = {},
    differentialDiagnoses = [],
    medicationSafety = {},
    recommendations = [],
    modelMetadata = {},
    disclaimer,
    // ── New expert protocol fields ──────────────────────────────────────────
    image_quality,
    morphological_features,
    malignancy_risk,
    recommended_clinical_action,
    primary_diagnosis,
  } = analysisData;

  // Triage configuration styling
  const triageConfig = {
    Emergency: {
      bg: 'bg-rose-500/10 text-rose-200 border-rose-500/40',
      badge: 'bg-rose-600 text-white',
      label: 'Emergency / Immediate Evaluation Needed',
      icon: AlertTriangle
    },
    'Same-Day': {
      bg: 'bg-rose-500/10 text-rose-200 border-rose-500/30',
      badge: 'bg-rose-600 text-white',
      label: 'Same-Day Medical Evaluation Recommended',
      icon: AlertCircle
    },
    'Dermatologist Soon': {
      bg: 'bg-amber-500/10 text-amber-200 border-amber-500/30',
      badge: 'bg-amber-500 text-slate-950',
      label: 'Dermatologist Evaluation Soon (1-2 Weeks)',
      icon: Clock
    },
    'Routine Consultation': {
      bg: 'bg-teal-500/10 text-teal-200 border-teal-500/30',
      badge: 'bg-teal-400 text-slate-950',
      label: 'Routine Consultation Appropriate',
      icon: CheckCircle2
    },
    Monitor: {
      bg: 'bg-slate-900 text-slate-200 border-slate-800',
      badge: 'bg-slate-700 text-white',
      label: 'Monitoring May Be Appropriate',
      icon: Activity
    }
  };

  const triageStyle = triageConfig[triage.level] || triageConfig['Routine Consultation'];

  // ── Malignancy Risk Meter config ─────────────────────────────────────
  const malignancyConfig = {
    'Benign':           { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-500', fill: 10, icon: ShieldCheck, label: 'Benign' },
    'Indeterminate':    { color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-400',   fill: 40, icon: AlertCircle,  label: 'Indeterminate' },
    'Suspicious':       { color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  bar: 'bg-orange-500',  fill: 70, icon: AlertTriangle, label: 'Suspicious' },
    'Highly Suspicious':{ color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    bar: 'bg-rose-500',    fill: 95, icon: Siren,          label: 'Highly Suspicious' },
  };
  const riskCfg = malignancyConfig[malignancy_risk] || malignancyConfig['Indeterminate'];

  // ── Clinical action banner config ─────────────────────────────────
  const actionConfig = {
    'Routine monitoring':      { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Activity },
    'Non-urgent consult':      { color: 'text-sky-300',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     icon: Stethoscope },
    'Urgent dermoscopy/biopsy':{ color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    icon: Zap },
  };
  const actionCfg = actionConfig[recommended_clinical_action] || actionConfig['Non-urgent consult'];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 my-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNewScan}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-slate-200 hover:text-slate-100 border border-slate-800 text-xs font-bold shadow-sm cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>New Scan</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCaseSummaryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Tele-Derm Summary</span>
          </button>

          <button
            onClick={onSaveToHistory}
            disabled={isSaved}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
              isSaved 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 border-transparent shadow-lg shadow-cyan-500/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{isSaved ? 'Saved' : 'Save Report'}</span>
          </button>
        </div>
      </div>

      {/* ─── IMAGE QUALITY BADGE PANEL (Step 1 Protocol) ────────────── */}
      {image_quality && (
        <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-wrap gap-3 items-center animate-in fade-in duration-300">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Step 1 — Image Integrity</span>
          </div>

          {/* Clarity badge */}
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
            image_quality.clarity === 'Adequate' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
            image_quality.clarity === 'Suboptimal' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
            'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            Clarity: {image_quality.clarity}
          </span>

          {/* Fitzpatrick badge */}
          {image_quality.fitzpatrick_type_estimate && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-violet-500/10 text-violet-300 border border-violet-500/30">
              Fitzpatrick {image_quality.fitzpatrick_type_estimate}
            </span>
          )}

          {/* Artifact list */}
          {image_quality.artifacts_present && image_quality.artifacts_present.length > 0 && image_quality.artifacts_present[0] !== 'none' && (
            <div className="flex flex-wrap gap-1.5">
              {image_quality.artifacts_present.map((art, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  ⚠ {art}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI UNCERTAINTY CIRCUIT BREAKER ALERT (If confidence is low / OOD) */}
      {uncertaintySystem.isUncertain && (
        <div className="glass-card bg-amber-500/10 border-2 border-amber-500/50 p-6 rounded-3xl text-left space-y-4 shadow-xl animate-in zoom-in-95">
          <div className="flex items-center gap-3 text-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">AI Confidence Insufficient for Reliable Assessment</h3>
              <p className="text-xs text-amber-300 font-bold">Safety Circuit Breaker Triggered</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
            {uncertaintySystem.reason || "The lesion appearance or symptom presentation falls outside standard high-confidence visual clusters. To avoid false reassurance or incorrect classification, the system recommends an in-person or tele-dermatology consultation."}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onFindDermatologist}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>Consult a Dermatologist</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Results Card */}
      <div className="glass-card-premium rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl relative overflow-hidden text-left bg-slate-900/90 text-slate-100">
        
        {/* Triage Level Banner */}
        {triage.level && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${triageStyle.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${triageStyle.badge}`}></div>
              <div>
                <span className="text-xs font-black block">{triageStyle.label}</span>
                {triage.escalationReason && (
                  <p className="text-[11px] font-semibold opacity-90 mt-0.5">{triage.escalationReason}</p>
                )}
              </div>
            </div>
            {triage.score >= 3 && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 self-start sm:self-auto shadow-xs">
                Escalation Priority #{triage.score}
              </span>
            )}
          </div>
        )}

        {/* Red Flags Callout */}
        {triage.redFlags && triage.redFlags.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Red Flag Clinical Symptoms Flagged:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-200 space-y-1 font-bold">
              {triage.redFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary Diagnosis & Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-slate-800 pb-6">
          <div className="md:col-span-4 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-48 md:h-full flex items-center justify-center shadow-lg">
            <img
              src={imageSrc}
              alt="Analyzed skin"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-cyan-300 font-mono font-bold border border-cyan-500/40 flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>CDSS AI Scan</span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-xs">
                Confidence: {confidence}%
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 shadow-xs">
                Stage: {severity}
              </span>
              {analysisData.icd10 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-xs">
                  ICD-10: {analysisData.icd10}
                </span>
              )}
              {analysisData.fitzpatrick && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Fitzpatrick {analysisData.fitzpatrick.fitzpatrickType || 'III'}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {primaryCondition}
              </h2>
            </div>

            {/* 3-Model Ensemble Confidence Breakdown */}
            {analysisData.ensembleBreakdown && (
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-200">
                  <span>3-Model Ensemble AI Pipeline Breakdown</span>
                  <span className="text-cyan-300 font-mono font-black">Combined: {analysisData.ensembleBreakdown.ensembleScore}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xs">
                    <span className="block text-slate-400 font-bold">Model A (Vision):</span>
                    <span className="text-teal-300 font-black">{analysisData.ensembleBreakdown.visualFeatureModelA}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xs">
                    <span className="block text-slate-400 font-bold">Model B (Saliency):</span>
                    <span className="text-cyan-300 font-black">{analysisData.ensembleBreakdown.saliencyTextureModelB}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xs">
                    <span className="block text-slate-400 font-bold">Model C (Context):</span>
                    <span className="text-blue-300 font-black">{analysisData.ensembleBreakdown.multimodalContextModelC}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Observation Summary */}
        <div className="bg-slate-950/80 rounded-2xl p-4.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-100 text-sm font-extrabold">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>AI Observation Summary</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {explanation}
          </p>
        </div>

        {/* ─── MORPHOLOGICAL FEATURE GRID (Step 2 Protocol) ────────────────── */}
        {morphological_features && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-violet-400" />
              <span>Step 2 — Morphological Deconstruction (ABCDE)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Asymmetry */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider block">A — Asymmetry</span>
                <p className="text-xs font-semibold text-slate-200">{morphological_features.asymmetry}</p>
              </div>

              {/* Border */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">B — Border</span>
                <p className="text-xs font-semibold text-slate-200">{morphological_features.border_characteristics}</p>
              </div>
            </div>

            {/* Color palette chips */}
            {morphological_features.color_distribution && morphological_features.color_distribution.length > 0 && (
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">C — Color Distribution</span>
                <div className="flex flex-wrap gap-1.5">
                  {morphological_features.color_distribution.map((color, i) => {
                    const colorMap = {
                      'red': 'bg-red-500/20 text-red-300 border-red-500/30',
                      'pink': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
                      'dark red': 'bg-red-700/20 text-red-400 border-red-600/30',
                      'brown': 'bg-amber-800/20 text-amber-400 border-amber-700/30',
                      'dark brown': 'bg-amber-900/30 text-amber-500 border-amber-800/40',
                      'black': 'bg-slate-700/40 text-slate-200 border-slate-600/40',
                      'blue-gray': 'bg-blue-900/30 text-blue-300 border-blue-700/30',
                      'white': 'bg-slate-100/10 text-slate-200 border-slate-400/30',
                      'silvery-white': 'bg-slate-300/10 text-slate-300 border-slate-400/30',
                      'tan': 'bg-yellow-700/20 text-yellow-400 border-yellow-600/30',
                    };
                    const cls = colorMap[color.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700';
                    return (
                      <span key={i} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cls}`}>
                        {color}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dermoscopic structures */}
            {morphological_features.dermoscopic_structures && morphological_features.dermoscopic_structures.length > 0 && (
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider block">D — Dermoscopic Structures</span>
                <div className="flex flex-wrap gap-1.5">
                  {morphological_features.dermoscopic_structures.map((struct, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 capitalize">
                      {struct}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── MALIGNANCY RISK METER + CLINICAL ACTION BANNER (Steps 3 & 4) ─── */}
        {malignancy_risk && (
          <div className="space-y-3 animate-in fade-in duration-300">

            {/* Malignancy Risk Meter */}
            <div className={`rounded-2xl p-4 border ${riskCfg.bg} ${riskCfg.border} space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl ${riskCfg.bg} border ${riskCfg.border} flex items-center justify-center`}>
                    <riskCfg.icon className={`w-4 h-4 ${riskCfg.color}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Step 3 — Malignancy Risk Assessment</span>
                    <span className={`text-sm font-black ${riskCfg.color}`}>{malignancy_risk}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full border ${riskCfg.bg} ${riskCfg.color} ${riskCfg.border}`}>
                  {riskCfg.fill}% Risk Index
                </span>
              </div>

              {/* Risk bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${riskCfg.bar} transition-all duration-700`}
                  style={{ width: `${riskCfg.fill}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>Benign</span>
                </div>
                <div className="flex-1 border-t border-dashed border-slate-700"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div><span>Indeterminate</span>
                </div>
                <div className="flex-1 border-t border-dashed border-slate-700"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div><span>Suspicious</span>
                </div>
                <div className="flex-1 border-t border-dashed border-slate-700"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div><span>Highly Suspicious</span>
                </div>
              </div>
            </div>

            {/* Recommended Clinical Action */}
            {recommended_clinical_action && (
              <div className={`rounded-2xl p-4 border ${actionCfg.bg} ${actionCfg.border} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${actionCfg.bg} border ${actionCfg.border} flex items-center justify-center shrink-0`}>
                    <actionCfg.icon className={`w-4.5 h-4.5 ${actionCfg.color}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Step 4 — Recommended Clinical Action</span>
                    <span className={`text-sm font-black ${actionCfg.color}`}>{recommended_clinical_action}</span>
                  </div>
                </div>
                {recommended_clinical_action === 'Urgent dermoscopy/biopsy' && (
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-rose-600 text-white border border-rose-500 shrink-0 animate-pulse">
                    URGENT
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Visual Observations Matrix */}
        {visualObservations && Object.keys(visualObservations).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Visible Skin Feature Observations</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(visualObservations).map(([key, val]) => (
                <div key={key} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {key}
                  </span>
                  <span className="text-xs font-extrabold text-teal-300 mt-0.5 block truncate" title={val}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations & Actionable Next Steps */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Actionable Next Steps & Care Guidance</span>
            </h3>

            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 font-semibold bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explainable AI Lesion Segmentation & Heatmap */}
        <LesionSegmentation imageSrc={imageSrc} conditionName={primaryCondition} />

        {/* Differential Diagnoses with Supporting & Unfitting Features */}
        {differentialDiagnoses && differentialDiagnoses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>Ranked Differential Diagnoses & Clinical Features</span>
            </h3>

            <div className="space-y-3">
              {differentialDiagnoses.map((item, idx) => (
                <div key={idx} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-100">{item.name}</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {item.confidence}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{item.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                    {item.supportingFeatures && (
                      <div className="text-emerald-200 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                        <span className="font-extrabold block text-emerald-300">✓ Supporting Features:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px] font-semibold text-emerald-200">
                          {item.supportingFeatures.map((sf, i) => <li key={i}>{sf}</li>)}
                        </ul>
                      </div>
                    )}

                    {item.unfittingFeatures && (
                      <div className="text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                        <span className="font-extrabold block text-amber-300">✕ Features That Don't Fit:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px] font-semibold text-amber-200">
                          {item.unfittingFeatures.map((uf, i) => <li key={i}>{uf}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {item.distinguishingFactors && (
                    <p className="text-[11px] text-slate-300 font-medium italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-slate-200">Distinguishing Factor:</strong> {item.distinguishingFactors}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABCDE Skin Cancer Screening Card (if pigmented lesion) */}
        {abcdeAnalysis && abcdeAnalysis.asymmetry && (
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>ABCDE Suspicious Lesion Screening Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-extrabold text-cyan-300 block">A - Asymmetry:</span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">{abcdeAnalysis.asymmetry}</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-extrabold text-cyan-300 block">B - Border Irregularity:</span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">{abcdeAnalysis.border}</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-extrabold text-cyan-300 block">C - Color Variation:</span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">{abcdeAnalysis.color}</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-extrabold text-cyan-300 block">D - Diameter:</span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">{abcdeAnalysis.diameter}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-extrabold text-cyan-300 block">E - Evolution / Change:</span>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">{abcdeAnalysis.evolution}</p>
            </div>
          </div>
        )}

        {/* Medication & Treatment Safety Layer */}
        {medicationSafety && (medicationSafety.warnings?.length > 0 || medicationSafety.safeGeneralAdvice?.length > 0 || medicationSafety.allergyAlerts?.length > 0) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Treatment & Medication Safety Layer</span>
            </h3>

            {/* Drug Interaction & Allergy Alerts */}
            {medicationSafety.allergyAlerts && medicationSafety.allergyAlerts.length > 0 && (
              <div className="space-y-2">
                {medicationSafety.allergyAlerts.map((alert, i) => (
                  <div key={i} className="bg-rose-500/10 border border-rose-500/40 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-black text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{alert.title}</span>
                    </span>
                    <p className="text-[11px] text-rose-200 font-medium">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}

            {medicationSafety.warnings && medicationSafety.warnings.length > 0 && (
              <div className="space-y-1">
                {medicationSafety.warnings.map((warn, i) => (
                  <p key={i} className="text-xs font-bold text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                    ⚠️ {warn}
                  </p>
                ))}
              </div>
            )}

            {medicationSafety.safeGeneralAdvice && medicationSafety.safeGeneralAdvice.length > 0 && (
              <ul className="list-disc list-inside text-xs text-slate-300 font-medium space-y-1">
                {medicationSafety.safeGeneralAdvice.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Mandatory Medical Disclaimer */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1 text-xs text-slate-400">
          <span className="font-extrabold text-slate-200 block">CDSS Regulatory Framing Notice:</span>
          <p className="leading-relaxed font-medium">
            {disclaimer || "SkinScan AI is a Clinical Decision Support System. It provides automated observational screening and does not replace certified medical diagnosis. Always consult a licensed dermatologist."}
          </p>
          {modelMetadata.version && (
            <p className="text-[10px] font-mono font-bold text-slate-500 pt-1">
              Traceability Metadata: {modelMetadata.version} • {modelMetadata.provider} • Latency: {modelMetadata.inferenceTimeMs || 120}ms
            </p>
          )}
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onFindDermatologist}
          className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <MapPin className="w-4 h-4" />
          <span>Find Dermatologist Near Me</span>
        </button>

        <button
          onClick={onNewScan}
          className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-bold border border-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Perform Another Scan</span>
        </button>
      </div>

      {/* Tele-Dermatology Printable / Formatted Case Summary Modal */}
      {showCaseSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-slate-800 space-y-4 text-left relative shadow-2xl animate-in fade-in zoom-in-95 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">Tele-Dermatology Clinician Case Summary</h3>
                <p className="text-xs text-slate-400 font-medium">Printable summary ready for physician consultation</p>
              </div>
              <button
                onClick={() => setShowCaseSummaryModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-200">
              <div className="border-b border-slate-800 pb-2">
                <p className="font-extrabold text-cyan-400">SKINSCAN AI TELE-DERMATOLOGY REPORT</p>
                <p className="text-[10px] text-slate-400 font-bold">Date: {new Date().toLocaleString()} • Ref: #{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
              </div>

              <p><strong>Primary AI Observation:</strong> {primaryCondition} ({confidence}% confidence)</p>
              <p><strong>Triage Urgency:</strong> {triage.level || 'Routine Consultation'}</p>
              <p><strong>Red Flags:</strong> {triage.redFlags?.join(', ') || 'None reported'}</p>
              <p><strong>Observation Summary:</strong> {explanation}</p>
              <p><strong>Differential Diagnoses:</strong> {differentialDiagnoses.map(d => `${d.name} (${d.confidence}%)`).join('; ')}</p>
              <p><strong>Safety Warnings:</strong> {medicationSafety.warnings?.join(' ') || 'None'}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Download PDF</span>
              </button>

              <button
                onClick={() => setShowCaseSummaryModal(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


