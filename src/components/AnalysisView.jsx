import React, { useEffect, useState } from 'react';
import LesionSegmentation from './LesionSegmentation';
import { 
  Activity, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, 
  MapPin, BookmarkCheck, Share2, ArrowLeft, Info, Stethoscope, FileText,
  AlertCircle, ShieldCheck, Flame, Layers, Download, Check, Clock
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

  if (!analysisData) return null;

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
    disclaimer
  } = analysisData;

  // Triage configuration styling
  const triageConfig = {
    Emergency: {
      bg: 'bg-rose-950/90 text-rose-200 border-rose-500/80',
      badge: 'bg-rose-500 text-white',
      label: 'Emergency / Immediate Evaluation Needed',
      icon: AlertTriangle
    },
    'Same-Day': {
      bg: 'bg-rose-950/80 text-rose-300 border-rose-600/60',
      badge: 'bg-rose-600 text-white',
      label: 'Same-Day Medical Evaluation Recommended',
      icon: AlertCircle
    },
    'Dermatologist Soon': {
      bg: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
      badge: 'bg-amber-400 text-slate-950',
      label: 'Dermatologist Evaluation Soon (1-2 Weeks)',
      icon: Clock
    },
    'Routine Consultation': {
      bg: 'bg-teal-950/80 text-teal-300 border-teal-500/50',
      badge: 'bg-teal-400 text-slate-950',
      label: 'Routine Consultation Appropriate',
      icon: CheckCircle2
    },
    Monitor: {
      bg: 'bg-slate-900/90 text-slate-300 border-slate-700',
      badge: 'bg-slate-700 text-slate-200',
      label: 'Monitoring May Be Appropriate',
      icon: Activity
    }
  };

  const triageStyle = triageConfig[triage.level] || triageConfig['Routine Consultation'];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 my-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNewScan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Scan</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCaseSummaryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-800/40 text-xs font-bold shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Tele-Derm Summary</span>
          </button>

          <button
            onClick={onSaveToHistory}
            disabled={isSaved}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isSaved 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-800/40 shadow-sm'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{isSaved ? 'Saved' : 'Save Report'}</span>
          </button>
        </div>
      </div>

      {/* AI UNCERTAINTY CIRCUIT BREAKER ALERT (If confidence is low / OOD) */}
      {uncertaintySystem.isUncertain && (
        <div className="glass-card bg-amber-950/60 border-2 border-amber-500 p-6 rounded-3xl text-left space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="flex items-center gap-3 text-amber-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/50">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">AI Confidence Insufficient for Reliable Assessment</h3>
              <p className="text-xs text-amber-300/90 font-medium">Safety Circuit Breaker Triggered</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed bg-amber-950/80 p-3.5 rounded-2xl border border-amber-800/60">
            {uncertaintySystem.reason || "The lesion appearance or symptom presentation falls outside standard high-confidence visual clusters. To avoid false reassurance or incorrect classification, the system recommends an in-person or tele-dermatology consultation."}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onFindDermatologist}
              className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-400/20"
            >
              <MapPin className="w-4 h-4" />
              <span>Consult a Dermatologist</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Results Card */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl relative overflow-hidden text-left">
        
        {/* Triage Level Banner */}
        {triage.level && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${triageStyle.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${triageStyle.badge}`}></div>
              <div>
                <span className="text-xs font-bold block">{triageStyle.label}</span>
                {triage.escalationReason && (
                  <p className="text-[11px] opacity-90 mt-0.5">{triage.escalationReason}</p>
                )}
              </div>
            </div>
            {triage.score >= 3 && (
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/40 shrink-0 self-start sm:self-auto">
                Escalation Priority #{triage.score}
              </span>
            )}
          </div>
        )}

        {/* Red Flags Callout */}
        {triage.redFlags && triage.redFlags.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Red Flag Clinical Symptoms Flagged:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-0.5 font-medium">
              {triage.redFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary Diagnosis & Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-slate-800 pb-6">
          <div className="md:col-span-4 relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 h-48 md:h-full flex items-center justify-center">
            <img
              src={imageSrc}
              alt="Analyzed skin"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-cyan-300 font-mono border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>CDSS AI Scan</span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                Confidence: {confidence}%
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800">
                Stage: {severity}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {primaryCondition}
              </h2>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Observation Summary */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>AI Observation Summary</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Visual Observations Matrix */}
        {visualObservations && Object.keys(visualObservations).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Visible Skin Feature Observations</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(visualObservations).map(([key, val]) => (
                <div key={key} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {key}
                  </span>
                  <span className="text-xs font-medium text-cyan-200 mt-0.5 block truncate" title={val}>
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
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Actionable Next Steps & Care Guidance</span>
            </h3>

            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
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
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>Ranked Differential Diagnoses & Clinical Features</span>
            </h3>

            <div className="space-y-3">
              {differentialDiagnoses.map((item, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{item.name}</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                      {item.confidence}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                    {item.supportingFeatures && (
                      <div className="text-emerald-300 bg-emerald-950/30 p-2 rounded-xl border border-emerald-900/40">
                        <span className="font-semibold block text-emerald-400">✓ Supporting Features:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                          {item.supportingFeatures.map((sf, i) => <li key={i}>{sf}</li>)}
                        </ul>
                      </div>
                    )}

                    {item.unfittingFeatures && (
                      <div className="text-amber-300 bg-amber-950/30 p-2 rounded-xl border border-amber-900/40">
                        <span className="font-semibold block text-amber-400">✕ Features That Don't Fit:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                          {item.unfittingFeatures.map((uf, i) => <li key={i}>{uf}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {item.distinguishingFactors && (
                    <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-xl">
                      <strong>Distinguishing Factor:</strong> {item.distinguishingFactors}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABCDE Skin Cancer Screening Card (if pigmented lesion) */}
        {abcdeAnalysis && abcdeAnalysis.asymmetry && (
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>ABCDE Suspicious Lesion Screening Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">A - Asymmetry:</span>
                <p className="text-[11px] text-slate-300 mt-0.5">{abcdeAnalysis.asymmetry}</p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">B - Border Irregularity:</span>
                <p className="text-[11px] text-slate-300 mt-0.5">{abcdeAnalysis.border}</p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">C - Color Variation:</span>
                <p className="text-[11px] text-slate-300 mt-0.5">{abcdeAnalysis.color}</p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">D - Diameter:</span>
                <p className="text-[11px] text-slate-300 mt-0.5">{abcdeAnalysis.diameter}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-cyan-400">E - Evolution / Change:</span>
              <p className="text-[11px] text-slate-300 mt-0.5">{abcdeAnalysis.evolution}</p>
            </div>
          </div>
        )}

        {/* Medication & Treatment Safety Layer */}
        {medicationSafety && (medicationSafety.warnings?.length > 0 || medicationSafety.safeGeneralAdvice?.length > 0) && (
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Treatment & Medication Safety Layer</span>
            </h3>

            {medicationSafety.warnings && medicationSafety.warnings.length > 0 && (
              <div className="space-y-1">
                {medicationSafety.warnings.map((warn, i) => (
                  <p key={i} className="text-xs font-semibold text-rose-300 bg-rose-950/60 p-2 rounded-xl border border-rose-800/50">
                    ⚠️ {warn}
                  </p>
                ))}
              </div>
            )}

            {medicationSafety.safeGeneralAdvice && medicationSafety.safeGeneralAdvice.length > 0 && (
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {medicationSafety.safeGeneralAdvice.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Mandatory Medical Disclaimer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1 text-xs text-slate-400">
          <span className="font-bold text-slate-300 block">CDSS Regulatory Framing Notice:</span>
          <p className="leading-relaxed">
            {disclaimer || "SkinScan AI is a Clinical Decision Support System. It provides automated observational screening and does not replace certified medical diagnosis. Always consult a licensed dermatologist."}
          </p>
          {modelMetadata.version && (
            <p className="text-[10px] font-mono text-slate-500 pt-1">
              Traceability Metadata: {modelMetadata.version} • {modelMetadata.provider} • Latency: {modelMetadata.inferenceTimeMs || 120}ms
            </p>
          )}
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onFindDermatologist}
          className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
        >
          <MapPin className="w-4 h-4" />
          <span>Find Dermatologist Near Me</span>
        </button>

        <button
          onClick={onNewScan}
          className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Perform Another Scan</span>
        </button>
      </div>

      {/* Tele-Dermatology Printable / Formatted Case Summary Modal */}
      {showCaseSummaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-slate-700 space-y-4 text-left relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Tele-Dermatology Clinician Case Summary</h3>
                <p className="text-xs text-slate-400">Printable summary ready for physician consultation</p>
              </div>
              <button
                onClick={() => setShowCaseSummaryModal(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
              <div className="border-b border-slate-800 pb-2">
                <p className="font-bold text-cyan-400">SKINSCAN AI TELE-DERMATOLOGY REPORT</p>
                <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleString()} • Ref: #{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
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
                className="w-1/2 py-2.5 px-4 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Download PDF</span>
              </button>

              <button
                onClick={() => setShowCaseSummaryModal(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800"
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

