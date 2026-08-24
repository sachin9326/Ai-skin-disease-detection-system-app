import React, { useState, useEffect } from 'react';
import { getAppSettings, saveAppSettings } from '../utils/storage';
import { Settings, Key, Cpu, ShieldCheck, Check, X, Sparkles, Sliders } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [provider, setProvider] = useState('demo');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const s = getAppSettings();
      setProvider(s.provider || 'demo');
      setApiKey(s.apiKey || '');
      setModel(s.model || 'claude-3-5-sonnet-20241022');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAppSettings({
      provider,
      apiKey,
      model
    });
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 space-y-5 text-left relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">AI Vision Engine Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
            Select Vision Processing Mode
          </label>

          <div className="space-y-2">
            {/* Demo / Zero-Config */}
            <div
              onClick={() => setProvider('demo')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                provider === 'demo'
                  ? 'bg-cyan-950/70 border-cyan-500/80 text-slate-100'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Smart Local Feature Analyzer</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">Zero-Config</span>
                </div>
                <p className="text-[11px] text-slate-400">Processes image pixel metrics without requiring external API keys. Always active out of the box.</p>
              </div>
            </div>

            {/* Anthropic Claude */}
            <div
              onClick={() => setProvider('claude')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                provider === 'claude'
                  ? 'bg-cyan-950/70 border-cyan-500/80 text-slate-100'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-100">Anthropic Claude Vision API</div>
                <p className="text-[11px] text-slate-400">Claude 3.5 Sonnet / Haiku vision models for clinical observation details.</p>
              </div>
            </div>

            {/* Google Gemini */}
            <div
              onClick={() => setProvider('gemini')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                provider === 'gemini'
                  ? 'bg-cyan-950/70 border-cyan-500/80 text-slate-100'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-100">Google Gemini Vision API</div>
                <p className="text-[11px] text-slate-400">Gemini 1.5/3 multimodal vision model integration.</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Input if provider selected */}
        {provider !== 'demo' && (
          <div className="space-y-2 animate-in fade-in">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>{provider === 'claude' ? 'Anthropic API Key' : 'Gemini API Key'}</span>
            </label>
            <input
              type="password"
              placeholder={`Enter your ${provider === 'claude' ? 'sk-ant-...' : 'AIzaSy...'} key`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-400">
              API key is passed directly to your local backend server and never saved on external servers.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            {saveStatus ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Engine Settings</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
