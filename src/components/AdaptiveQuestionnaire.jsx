import React, { useState } from 'react';
import VoiceInput from './VoiceInput';
import { 
  HelpCircle, Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, 
  AlertTriangle, Sparkles, MapPin, Clock, Flame, Zap, Droplets, FileText, Plus
} from 'lucide-react';

export default function AdaptiveQuestionnaire({ onCancel, onSubmitQuestionnaire }) {
  const [bodyLocation, setBodyLocation] = useState('Arm / Hand');
  const [duration, setDuration] = useState('1-2 weeks');
  const [itching, setItching] = useState('Yes');
  const [pain, setPain] = useState('No');
  const [burning, setBurning] = useState('No');
  const [bleeding, setBleeding] = useState('No');
  const [scaling, setScaling] = useState('Yes');
  const [previousOccurrences, setPreviousOccurrences] = useState('No');
  const [sunExposure, setSunExposure] = useState('Moderate');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [showAdaptiveFollowUp, setShowAdaptiveFollowUp] = useState(false);
  const [itchingTiming, setItchingTiming] = useState('Started with rash');

  const handleVoiceData = (extracted) => {
    if (extracted.bodyLocation) setBodyLocation(extracted.bodyLocation);
    if (extracted.duration) setDuration(extracted.duration);
    if (extracted.itching !== undefined) setItching(extracted.itching ? 'Yes' : 'No');
    if (extracted.pain !== undefined) setPain(extracted.pain ? 'Yes' : 'No');
    if (extracted.burning !== undefined) setBurning(extracted.burning ? 'Yes' : 'No');
    if (extracted.bleeding !== undefined) setBleeding(extracted.bleeding ? 'Yes' : 'No');
    if (extracted.rawNote) {
      setMedicalHistory(prev => prev ? `${prev}. Voice note: ${extracted.rawNote}` : extracted.rawNote);
    }
  };

  const handleItchingChange = (val) => {
    setItching(val);
    if (val === 'Yes') {
      setShowAdaptiveFollowUp(true);
    } else {
      setShowAdaptiveFollowUp(false);
    }
  };

  const addPresetToHistory = (presetText) => {
    setMedicalHistory(prev => prev ? `${prev}, ${presetText}` : presetText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      bodyLocation,
      duration,
      itching: itching === 'Yes',
      pain: pain === 'Yes',
      burning: burning === 'Yes',
      bleeding: bleeding === 'Yes',
      scaling: scaling === 'Yes',
      previousOccurrences,
      sunExposure,
      medicalHistory,
      itchingTiming: showAdaptiveFollowUp ? itchingTiming : null
    };
    onSubmitQuestionnaire(payload);
  };

  const presetHistoryTags = [
    '+ History of Eczema',
    '+ Allergic to Penicillin',
    '+ Applied Hydrocortisone',
    '+ Sensitive Skin',
    '+ Family Psoriasis History'
  ];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 my-2 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-950 to-teal-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold shadow-md">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Multimodal Patient Context</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Adaptive Clinical Symptom Questionnaire
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Complementing visual analysis with clinical context significantly improves differential diagnostic accuracy and safety triage.
        </p>
      </div>

      {/* Voice Input Module */}
      <VoiceInput onTranscriptExtracted={handleVoiceData} />

      {/* Main Questionnaire Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-6 text-left shadow-2xl relative overflow-hidden">
        
        {/* Ambient top right glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Section 1: Location & Duration */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4" />
            <span>1. Presentation Parameters</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Body Location */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 group focus-within:border-cyan-500/60 transition-colors">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Affected Body Location</span>
              </label>
              <select
                value={bodyLocation}
                onChange={(e) => setBodyLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="Arm / Hand">Arm / Hand</option>
                <option value="Leg / Foot">Leg / Foot</option>
                <option value="Face / Neck">Face / Neck</option>
                <option value="Torso / Back / Chest">Torso / Back / Chest</option>
                <option value="Scalp">Scalp</option>
                <option value="Widespread / Multiple Body Sites">Widespread / Multiple Sites</option>
              </select>
            </div>

            {/* Duration */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2 group focus-within:border-cyan-500/60 transition-colors">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Duration of Presentation</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="Less than 48 hours">Less than 48 hours (Acute)</option>
                <option value="3-7 days">3-7 days</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="1-3 months">1-3 months</option>
                <option value="Chronic (> 3 months)">Chronic (&gt; 3 months)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 2: Symptom Indicators Cards */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>2. Key Clinical Symptom Indicators</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Card 1: Itching */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Itching / Pruritus?</span>
                  <span className="text-[10px] text-slate-400">Irritating skin urge</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleItchingChange('Yes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    itching === 'Yes' ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleItchingChange('No')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    itching === 'No' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Card 2: Pain */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold border border-rose-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Pain / Soreness?</span>
                  <span className="text-[10px] text-slate-400">Tenderness or ache</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPain('Yes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pain === 'Yes' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPain('No')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pain === 'No' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Card 3: Burning */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Burning Sensation?</span>
                  <span className="text-[10px] text-slate-400">Stinging heat feel</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBurning('Yes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    burning === 'Yes' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setBurning('No')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    burning === 'No' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Card 4: Bleeding */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-400 flex items-center justify-center font-bold border border-rose-600/20">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Bleeding / Oozing?</span>
                  <span className="text-[10px] text-slate-400">Fluid leakage or blood</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBleeding('Yes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bleeding === 'Yes' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setBleeding('No')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bleeding === 'No' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Adaptive Question Callout */}
        {showAdaptiveFollowUp && (
          <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/50 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <HelpCircle className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Adaptive AI Clinical Follow-Up:</span>
            </div>
            <p className="text-xs text-slate-200 font-medium">
              "Did the itching sensation start before or after the visible rash/lesion appeared?"
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItchingTiming('Started before rash')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  itchingTiming === 'Started before rash' 
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 border-cyan-300 shadow-md' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Started before rash
              </button>
              <button
                type="button"
                onClick={() => setItchingTiming('Started with rash')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  itchingTiming === 'Started with rash' 
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 border-cyan-300 shadow-md' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Started with rash
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Medical History & Presets */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>3. Relevant Medical History / Allergies / Current Ointments</span>
            </label>

            <textarea
              rows="3"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Asthma history, allergic to penicillin, applied hydrocortisone cream for 3 days..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none resize-none transition-colors"
            />

            {/* Quick Tap Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Tap Medical Tags:
              </span>
              <div className="flex flex-wrap gap-2">
                {presetHistoryTags.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addPresetToHistory(tag.replace('+ ', ''))}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 hover:border-teal-500/40 transition-colors flex items-center gap-1"
                  >
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800 transition-colors active:scale-95"
          >
            Back
          </button>
          
          <button
            type="submit"
            className="w-2/3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all hover:scale-102 active:scale-95"
          >
            <span>Proceed to AI Vision Analysis</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </form>
    </div>
  );
}
