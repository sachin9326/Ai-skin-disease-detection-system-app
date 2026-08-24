import React, { useState, useEffect } from 'react';
import { getScanHistory, deleteScanFromHistory, clearScanHistory } from '../utils/storage';
import ImageComparer from './ImageComparer';
import { History, Trash2, Calendar, Eye, AlertCircle, ArrowLeft, Camera, Sparkles, MapPin, TrendingUp, Sliders } from 'lucide-react';

export default function HistoryView({ onSelectSavedScan, onNewScan, onFindDermatologist }) {
  const [history, setHistory] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [compareSelection, setCompareSelection] = useState([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this scan from history?')) {
      const updated = deleteScanFromHistory(id);
      setHistory(updated);
      if (selectedScan?.id === id) {
        setSelectedScan(null);
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all saved scan history? This action cannot be undone.')) {
      clearScanHistory();
      setHistory([]);
      setSelectedScan(null);
    }
  };

  const toggleSelectForCompare = (scan, e) => {
    e.stopPropagation();
    if (compareSelection.find(s => s.id === scan.id)) {
      setCompareSelection(compareSelection.filter(s => s.id !== scan.id));
    } else {
      if (compareSelection.length >= 2) {
        setCompareSelection([compareSelection[1], scan]);
      } else {
        setCompareSelection([...compareSelection, scan]);
      }
    }
  };

  if (history.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto glass-card p-8 rounded-3xl text-center space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
          <History className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-200">No Scan History Saved</h3>
        <p className="text-xs text-slate-400">
          Your saved skin analysis reports and longitudinal series will appear here in your browser's private local storage.
        </p>
        <button
          onClick={onNewScan}
          className="mt-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <Camera className="w-4 h-4" />
          <span>Start First Scan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 p-4 my-2 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Skin Health Timeline & History</span>
          </h2>
          <p className="text-xs text-slate-400">{history.length} record(s) saved in private local storage.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {compareSelection.length === 2 && (
            <button
              onClick={() => setIsComparing(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Compare Selected (2)</span>
            </button>
          )}

          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {compareSelection.length > 0 && compareSelection.length < 2 && (
        <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3 text-xs text-cyan-300 flex items-center justify-between">
          <span>Select 1 more scan card below to launch side-by-side progression comparison.</span>
          <button
            onClick={() => setCompareSelection([])}
            className="text-[10px] underline text-cyan-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* History Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {history.map((scan) => {
          const formattedDate = new Date(scan.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const isSelectedForCompare = compareSelection.some(s => s.id === scan.id);

          const severityClass = 
            scan.severity === 'Early' ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50' :
            scan.severity === 'Extreme' ? 'bg-rose-950 text-rose-300 border-rose-800/50' :
            'bg-amber-950 text-amber-300 border-amber-800/50';

          return (
            <div
              key={scan.id}
              onClick={() => setSelectedScan(scan)}
              className={`glass-card glass-card-hover p-4 rounded-2xl border flex items-center gap-4 cursor-pointer text-left relative group ${
                isSelectedForCompare ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 relative">
                <img
                  src={scan.thumbnail}
                  alt={scan.primaryCondition}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    {formattedDate}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${severityClass}`}>
                    {scan.severity || 'Mid'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100 truncate">
                  {scan.primaryCondition}
                </h4>

                <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                  <span>Confidence: {scan.confidence}%</span>

                  {/* Checkbox for comparison */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelectForCompare(scan, e)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                      isSelectedForCompare 
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {isSelectedForCompare ? '✓ Selected' : '+ Compare'}
                  </button>
                </div>
              </div>

              {/* Delete button on hover */}
              <button
                onClick={(e) => handleDelete(scan.id, e)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 text-slate-400 hover:text-rose-400 border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete scan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Scan Details Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-slate-700 space-y-5 text-left relative animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedScan.primaryCondition}</h3>
                <span className="text-xs text-slate-400">
                  Scanned on {new Date(selectedScan.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <img
                src={selectedScan.thumbnail}
                alt="Scan detail"
                className="w-36 h-36 object-cover rounded-2xl border border-slate-700 bg-slate-950"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Confidence: {selectedScan.confidence}%
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200">
                    Stage: {selectedScan.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  {selectedScan.explanation}
                </p>
              </div>
            </div>

            {selectedScan.recommendations && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-200 block">Care Recommendations:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {selectedScan.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedScan(null);
                  onFindDermatologist();
                }}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Find Dermatologist</span>
              </button>

              <button
                onClick={() => setSelectedScan(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isComparing && compareSelection.length === 2 && (
        <ImageComparer
          scanA={compareSelection[0]}
          scanB={compareSelection[1]}
          onClose={() => setIsComparing(false)}
        />
      )}

    </div>
  );
}

