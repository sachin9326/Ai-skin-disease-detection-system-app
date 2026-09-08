import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Globe, Sparkles, AlertCircle, Check, Volume2, MessageSquare } from 'lucide-react';

export default function VoiceInput({ onTranscriptExtracted }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lang, setLang] = useState('hi-IN'); // 'en-US' | 'hi-IN'
  const [recognition, setRecognition] = useState(null);
  const [supportError, setSupportError] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportError('Voice input is not supported in this browser. You can type symptoms manually below.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    rec.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [lang]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Start speech error:', err);
      }
    }
  };

  const handleApplyVoiceData = (textToApply) => {
    const targetText = textToApply || transcript;
    if (!targetText) return;

    const lower = targetText.toLowerCase();
    const extracted = {};

    // Body location parsing
    if (lower.includes('haath') || lower.includes('hand') || lower.includes('arm')) extracted.bodyLocation = 'Arm / Hand';
    else if (lower.includes('ppair') || lower.includes('leg') || lower.includes('foot') || lower.includes('paon')) extracted.bodyLocation = 'Leg / Foot';
    else if (lower.includes('chehra') || lower.includes('face') || lower.includes('gardan')) extracted.bodyLocation = 'Face / Neck';
    else if (lower.includes('peth') || lower.includes('back') || lower.includes('chest') || lower.includes('chhati')) extracted.bodyLocation = 'Torso / Back / Chest';

    // Symptom parsing
    if (lower.includes('khujli') || lower.includes('itch')) extracted.itching = true;
    if (lower.includes('dard') || lower.includes('pain') || lower.includes('dukha')) extracted.pain = true;
    if (lower.includes('jalan') || lower.includes('burn')) extracted.burning = true;
    if (lower.includes('khoon') || lower.includes('bleed')) extracted.bleeding = true;

    // Duration parsing
    if (lower.includes('10 din') || lower.includes('10 days')) extracted.duration = '1-2 weeks';
    else if (lower.includes('hafte') || lower.includes('week')) extracted.duration = '1-2 weeks';
    else if (lower.includes('mahine') || lower.includes('month')) extracted.duration = '1-3 months';

    extracted.rawNote = targetText;
    onTranscriptExtracted(extracted);
  };

  const sampleChips = [
    { label: '🎙️ "Haath par 1 hafte se khujli hai"', text: 'Mere haath par ek hafte se khujli ho rahi hai' },
    { label: '🎙️ "Face par red rash aur jalan hai"', text: 'Face par red rash aur burning sensation hai 3 din se' },
    { label: '🎙️ "Legs par severe pain & dryness"', text: 'Legs par 2 weeks se dry skin aur severe pain hai' }
  ];

  return (
    <div className="w-full glass-card p-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950 to-cyan-950/20 space-y-4 text-left shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
      
      {/* Ambient background glow orb */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Multilingual Voice AI Assistant</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Hindi / English
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Speak your symptoms naturally in Hindi, Hinglish or English.</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 self-start sm:self-auto shadow-inner">
          <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="hi-IN" className="bg-slate-900 text-slate-200">Hindi / Hinglish (हिन्दी)</option>
            <option value="en-US" className="bg-slate-900 text-slate-200">English (US)</option>
            <option value="mr-IN" className="bg-slate-900 text-slate-200">Marathi (मराठी)</option>
            <option value="ta-IN" className="bg-slate-900 text-slate-200">Tamil (தமிழ்)</option>
            <option value="bn-IN" className="bg-slate-900 text-slate-200">Bengali (বাংলা)</option>
            <option value="te-IN" className="bg-slate-900 text-slate-200">Telugu (తెలుగు)</option>
          </select>
        </div>
      </div>


      {supportError ? (
        <p className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-2xl border border-amber-800/40">
          {supportError}
        </p>
      ) : (
        <div className="space-y-3">
          
          {/* Main Voice Mic Input Container */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-gradient-to-br from-cyan-400 to-teal-500 hover:from-cyan-300 hover:to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak Symptoms'}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 stroke-[2.5]" />}
              </button>

              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                </span>
              )}
            </div>

            <div className="flex-1 min-h-[50px] bg-slate-950/90 px-4 py-3 rounded-2xl border border-slate-800 text-xs text-slate-200 flex items-center shadow-inner relative group focus-within:border-cyan-500/60 transition-colors">
              {transcript ? (
                <span className="font-mono text-cyan-200 font-medium text-xs leading-relaxed">
                  "{transcript}"
                </span>
              ) : (
                <span className="text-slate-500 italic text-xs flex items-center gap-2">
                  {isListening ? (
                    <span className="text-rose-400 font-medium flex items-center gap-1.5 animate-pulse">
                      <Volume2 className="w-4 h-4 text-rose-400" />
                      Listening... Speak now in Hindi or English
                    </span>
                  ) : (
                    <span>Tap mic button or try sample voice presets below...</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Action Row when transcript is recorded */}
          {transcript && (
            <div className="flex items-center justify-between pt-1 animate-in fade-in">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Speech captured. Apply to auto-fill form below.
              </span>
              <button
                type="button"
                onClick={() => handleApplyVoiceData()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-400/20 hover:scale-105 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Voice Data</span>
              </button>
            </div>
          )}

          {/* Quick Preset Voice Sample Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              <span>Or click a voice sample to test instant parsing:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(chip.text);
                    handleApplyVoiceData(chip.text);
                  }}
                  className="text-[11px] font-medium px-3 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-all hover:scale-102"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
