import React, { useState, useEffect } from 'react';
import DisclaimerBanner from './components/DisclaimerBanner';
import Header from './components/Header';
import CameraCapture from './components/CameraCapture';
import QualityCheck from './components/QualityCheck';
import Preprocessing from './components/Preprocessing';
import AdaptiveQuestionnaire from './components/AdaptiveQuestionnaire';
import AnalysisView from './components/AnalysisView';
import HistoryView from './components/HistoryView';
import DermLocator from './components/DermLocator';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import SkinRednessChecker from './components/SkinRednessChecker';
import { getScanHistory, setScanHistory, saveScanToHistory, getAppSettings } from './utils/storage';
import { getCurrentUser, logout as authLogout, fetchUserScansRemote } from './utils/auth';
import { analyzeSkinImageLocally } from './utils/skinClassifier';
import { Activity, Camera, History, MapPin, CheckCircle2, Stethoscope, BarChart3 } from 'lucide-react';
import './App.css';

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/predict$/, '');

export default function App() {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history' | 'locator' | 'doctor_dashboard' | 'admin_dashboard'
  const [workflowStep, setWorkflowStep] = useState('capture'); // 'capture' | 'quality_check' | 'preprocessing' | 'questionnaire' | 'analyzing' | 'results'
  const [currentImage, setCurrentImage] = useState(null);
  const [patientSymptoms, setPatientSymptoms] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize auth user on mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      syncRemoteScans();
    } else {
      updateHistoryCount();
    }
  }, []);

  useEffect(() => {
    updateHistoryCount();
  }, [workflowStep, activeTab, currentUser]);

  const updateHistoryCount = () => {
    const history = getScanHistory();
    setHistoryCount(history.length);
  };

  const syncRemoteScans = async () => {
    const remoteScans = await fetchUserScansRemote();
    if (remoteScans && remoteScans.length > 0) {
      setScanHistory(remoteScans);
    }
    updateHistoryCount();
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}! Role: ${user.role || 'Patient'}`);
    syncRemoteScans();
  };

  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
    showToast('Signed out successfully.');
    updateHistoryCount();
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle new image selected from Camera or File input
  const handleImageSelected = (imageDataUrl) => {
    setCurrentImage(imageDataUrl);
    setWorkflowStep('quality_check');
  };

  // Proceed from Quality Check to Questionnaire
  const handleProceedToQuestionnaire = () => {
    setWorkflowStep('questionnaire');
  };

  // Submit Questionnaire & Start AI Analysis
  const handleQuestionnaireSubmit = async (symptomsPayload) => {
    setPatientSymptoms(symptomsPayload);
    handleStartAnalysis();
  };

  // Execute AI Vision & Context Analysis
  const handleStartAnalysis = async () => {
    if (!currentImage) return;

    const setIsAnalyzing = setIsLoading;
    const setCurrentStep = (step) => setWorkflowStep(step === 'analysis' ? 'results' : step);

    setIsAnalyzing(true);
    let resultData = null;
    let gatekeeperRejected = false;
    let rejectionMessage = "";

    // Candidate backend API endpoints
    const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location ? window.location.protocol : 'http:';

    const candidateEndpoints = [`${API_BASE_URL}/predict`];
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      candidateEndpoints.push(`${protocol}//${hostname}:8000/predict`);
    }
    if (!candidateEndpoints.includes('http://localhost:8000/predict')) {
      candidateEndpoints.push('http://localhost:8000/predict');
    }

    // Convert Base64 image to Blob binary format
    let imageBlob = null;
    try {
      imageBlob = typeof currentImage === 'string' && currentImage.startsWith('data:')
        ? dataURLtoBlob(currentImage)
        : currentImage;
    } catch (e) {
      console.warn("Blob conversion note:", e);
    }

    // Try candidate API endpoints with 4-second connection timeout
    for (const endpoint of candidateEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const formData = new FormData();
        formData.append("file", imageBlob || currentImage, "scan.jpg");

        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.valid === false) {
            gatekeeperRejected = true;
            rejectionMessage = data.message;
            break;
          }

          resultData = data;
          break;
        }
      } catch (err) {
        console.warn(`API endpoint ${endpoint} connection skipped:`, err.message);
      }
    }

    // Gatekeeper rejection handling
    if (gatekeeperRejected) {
      alert(rejectionMessage);
      setIsAnalyzing(false);
      return;
    }

    // Client-side local AI fallback if remote Python server is offline/unreachable on production host
    if (!resultData) {
      try {
        console.log("Remote backend unreachable. Executing client-side hybrid AI engine fallback...");
        resultData = await analyzeSkinImageLocally(currentImage, patientSymptoms);
      } catch (fallbackErr) {
        console.error("Local AI inference error:", fallbackErr);
      }
    }

    if (resultData) {
      setAnalysisResult(resultData);
      setCurrentStep("analysis");
    } else {
      alert("Unable to complete skin analysis. Please ensure a clear photo is uploaded.");
    }

    setIsAnalyzing(false);
  };


  const handleSaveCurrentScan = () => {
    if (!analysisResult || !currentImage) return;
    const savedRecord = saveScanToHistory({
      thumbnail: currentImage,
      symptoms: patientSymptoms,
      ...analysisResult
    });
    if (savedRecord) {
      setIsSaved(true);
      updateHistoryCount();
      showToast('Scan report saved to your account!');
    }
  };

  const handleResetScan = () => {
    setCurrentImage(null);
    setPatientSymptoms({});
    setAnalysisResult(null);
    setWorkflowStep('capture');
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Mandatory Top Medical & Privacy Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        onGoHome={handleResetScan}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={historyCount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white border border-emerald-400 px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Workspace */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col justify-start">
        
        {activeTab === 'scan' && (
          <>
            {workflowStep === 'capture' && (
              <CameraCapture onImageSelected={handleImageSelected} />
            )}

            {workflowStep === 'quality_check' && currentImage && (
              <QualityCheck
                imageSrc={currentImage}
                onRetake={handleResetScan}
                onProceed={handleProceedToQuestionnaire}
                onOpenPreprocessing={() => setWorkflowStep('preprocessing')}
              />
            )}

            {workflowStep === 'preprocessing' && currentImage && (
              <Preprocessing
                imageSrc={currentImage}
                onCancel={() => setWorkflowStep('quality_check')}
                onSaveAdjusted={(adjustedImg) => {
                  setCurrentImage(adjustedImg);
                  setWorkflowStep('quality_check');
                }}
              />
            )}

            {workflowStep === 'questionnaire' && (
              <AdaptiveQuestionnaire
                onCancel={() => setWorkflowStep('quality_check')}
                onSubmitQuestionnaire={handleQuestionnaireSubmit}
              />
            )}

            {(workflowStep === 'analyzing' || workflowStep === 'results') && (
              <AnalysisView
                isLoading={isLoading}
                analysisData={analysisResult}
                analysisResult={analysisResult}
                imageSrc={currentImage}
                onSaveToHistory={handleSaveCurrentScan}
                isSaved={isSaved}
                onFindDermatologist={() => setActiveTab('locator')}
                onNewScan={handleResetScan}
                onBack={() => setWorkflowStep('capture')}
              />
            )}
          </>
        )}

        {activeTab === 'history' && (
          <HistoryView
            onNewScan={handleResetScan}
            onFindDermatologist={() => setActiveTab('locator')}
          />
        )}

        {activeTab === 'doctor_dashboard' && (
          <DoctorDashboard currentUser={currentUser} />
        )}

        {activeTab === 'admin_dashboard' && (
          <AdminDashboard />
        )}

        {activeTab === 'locator' && (
          <DermLocator />
        )}

        {activeTab === 'redness_checker' && (
          <SkinRednessChecker />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden sticky bottom-0 z-30 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
            activeTab === 'scan' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>Screening</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold relative transition-colors ${
            activeTab === 'history' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('doctor_dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
            activeTab === 'doctor_dashboard' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope className="w-5 h-5 text-cyan-400" />
          <span>Doctor</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
            activeTab === 'admin_dashboard' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Admin</span>
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}

