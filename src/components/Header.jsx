import React from 'react';
import { Activity, History, MapPin, Settings, Camera, User, LogOut, LogIn, Stethoscope, BarChart3, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-slate-900/85 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-3 shadow-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand Identity (Redirects to Home on Click) */}
        <button 
          onClick={() => {
            if (onGoHome) {
              onGoHome();
            } else {
              setActiveTab('scan');
            }
          }}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
          title="Return to Home / New Screening"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all">
            <Activity className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-400 border-2 border-slate-950"></span>
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-100 group-hover:text-cyan-300 transition-colors">
                SkinScan
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-xs">
                CDSS AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider font-bold uppercase">CLINICAL DECISION SUPPORT PLATFORM</p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Screening</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Timeline</span>
            {historyCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'history' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doctor_dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'doctor_dashboard'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20 font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            <span>Doctor Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('admin_dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'admin_dashboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Admin Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('locator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'locator'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Find Clinic</span>
          </button>
        </nav>

        {/* Right Actions: User Profile & Settings */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-2xl border border-slate-800/80 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[100px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Sign In / Role</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer"
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



