import React from 'react';
import { Activity, History, MapPin, Settings, Camera, User, LogOut, LogIn, Stethoscope, BarChart3 } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onGoHome,
  onOpenSettings, 
  historyCount, 
  currentUser, 
  onOpenAuth, 
  onLogout 
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        
        {/* Brand Identity (Redirects to Home on Click) */}
        <button 
          onClick={() => {
            if (onGoHome) {
              onGoHome();
            } else {
              setActiveTab('scan');
            }
          }}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          title="Return to Home / New Screening"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-teal-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-300 transition-colors">
                SkinScan
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                CDSS AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-medium">CLINICAL DECISION SUPPORT PLATFORM</p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Patient Screening</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Timeline</span>
            {historyCount > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full font-bold ${
                activeTab === 'history' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-900 text-cyan-300'
              }`}>
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doctor_dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'doctor_dashboard'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
            <span>Doctor Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('admin_dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin_dashboard'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Admin Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('locator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'locator'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Find Clinic</span>
          </button>
        </nav>

        {/* Right Actions: User Profile & Settings */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[100px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-bold shadow-md hover:from-cyan-400 hover:to-teal-400 transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Role</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="API & Model Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
}

