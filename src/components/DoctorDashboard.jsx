import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ShieldCheck, FileText, User, RefreshCw, Send, Check } from 'lucide-react';

export default function DoctorDashboard({ currentUser }) {
  const [queue, setQueue] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [reviewAction, setReviewAction] = useState('accept'); // 'accept' | 'modify' | 'reject'
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/doctor/queue');
      const data = await res.json();
      if (data.success && data.queue) {
        setQueue(data.queue);
        if (!selectedCase && data.queue.length > 0) {
          setSelectedCase(data.queue[0]);
          setFinalDiagnosis(data.queue[0].primaryCondition || '');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch doctor queue:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectCase = (c) => {
    setSelectedCase(c);
    setFinalDiagnosis(c.finalDiagnosis || c.primaryCondition || '');
    setNotes(c.clinicianNotes || '');
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/doctor/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: selectedCase.id,
          doctorId: currentUser?.id || 'usr_doctor_demo',
          doctorName: currentUser?.name || 'Dr. Sarah Lin (MD)',
          action: reviewAction,
          finalDiagnosis,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setToast(`Clinical evaluation saved for Scan #${selectedCase.id.substring(0, 8)}`);
        setTimeout(() => setToast(null), 3000);
        fetchQueue();
      }
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6 animate-in fade-in duration-200 text-left">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold border border-teal-500/30">
            <Stethoscope className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Dermatologist Clinical Portal</h2>
            <p className="text-xs text-slate-400">Review patient screening submissions, verify AI outputs, and record clinical diagnoses.</p>
          </div>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Grid: Priority Queue (Left) vs Case Review Panel (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Triage Queue */}
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Priority Patient Queue ({queue.length})
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Sorted by Urgency</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {queue.map((item) => {
              const isSelected = selectedCase?.id === item.id;
              const isHighRisk = item.triage?.level === 'Emergency' || item.triage?.level === 'Same-Day';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectCase(item)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                      : isHighRisk
                      ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.thumbnail || item.image}
                      alt="Thumbnail"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-950"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isHighRisk
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {item.triage?.level || 'Routine'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 truncate">
                        {item.primaryCondition}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Confidence: {item.confidence}%</span>
                        <span className={`font-semibold ${
                          item.clinicianStatus === 'Approved' ? 'text-emerald-400' :
                          item.clinicianStatus === 'Modified' ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {item.clinicianStatus || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Details & Review Override Form */}
        <div className="md:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400">PATIENT CASE #{selectedCase.id.substring(0, 10)}</span>
                  <h3 className="text-xl font-extrabold text-slate-100">{selectedCase.primaryCondition}</h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                  {selectedCase.triage?.level || 'Routine'}
                </span>
              </div>

              {/* Image & Observations */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={selectedCase.thumbnail || selectedCase.image}
                  alt="Lesion"
                  className="w-40 h-40 object-cover rounded-2xl border border-slate-700 bg-slate-950 shrink-0"
                />

                <div className="space-y-2 text-xs text-slate-300 flex-1">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-200">Patient Symptoms:</span>
                    <p className="text-slate-400 text-[11px]">
                      Location: {selectedCase.symptoms?.bodyLocation || 'Unspecified'} • Duration: {selectedCase.symptoms?.duration || 'Recent'} • Itching: {selectedCase.symptoms?.itching ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-cyan-300">AI Observation Summary:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedCase.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinician Action Form */}
              <form onSubmit={handleSaveReview} className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-slate-200 block">Clinician Decision & Diagnostic Override:</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('accept')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      reviewAction === 'accept' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Accept AI Finding</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('modify')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      reviewAction === 'modify' ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Modify Diagnosis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      reviewAction === 'reject' ? 'bg-rose-950 text-rose-300 border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Reject AI Finding</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Final Physician Diagnosis:</label>
                  <input
                    type="text"
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                    placeholder="Enter final confirmed diagnosis..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Clinician Clinical Notes & Rx Instructions:</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter clinical examination notes, biopsy recommendations, or prescription instructions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Review...' : 'Save & Authorize Clinical Report'}</span>
                </button>

              </form>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center space-y-2 border border-slate-800 text-slate-400">
              <Stethoscope className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">Select a patient case from the priority queue on the left to begin clinician review.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
