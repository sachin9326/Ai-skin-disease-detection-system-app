import React, { useState } from 'react';
import { MapPin, Search, ExternalLink, Navigation, Stethoscope, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DermLocator() {
  const [cityQuery, setCityQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setGeoStatus('Opening Google Maps...');

    // Open fallback immediately if geolocation API not present
    if (!navigator.geolocation) {
      window.open('https://www.google.com/maps/search/dermatologist+near+me', '_blank');
      setIsLocating(false);
      setGeoStatus(null);
      return;
    }

    // Try HTML5 GPS location with fast 3.5s timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsLocating(false);
        setGeoStatus(null);
        const mapsUrl = `https://www.google.com/maps/search/dermatologist+near+me/@${latitude},${longitude},14z`;
        window.open(mapsUrl, '_blank');
      },
      (error) => {
        console.warn('Geolocation fallback triggered:', error.message);
        setIsLocating(false);
        setGeoStatus(null);
        // Fallback: Open Google Maps directly with search query (Google Maps will auto-detect user IP location)
        window.open('https://www.google.com/maps/search/dermatologist+near+me', '_blank');
      },
      { timeout: 3500, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleSearchByQuery = (e) => {
    if (e) e.preventDefault();
    const query = cityQuery.trim() || 'dermatologist';
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query + (query.toLowerCase().includes('dermatologist') ? '' : ' dermatologist'))}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 my-2 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-2">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-teal-200 bg-clip-text text-transparent">
          Find a Dermatologist Near You
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Locate licensed dermatologists, dermatology clinics, and skin specialists nearby for certified diagnosis.
        </p>
      </div>

      {/* Main Location Action Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5 text-center shadow-xl">
        
        {/* Geolocation Button */}
        <div className="space-y-3">
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-base font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-teal-500/25 transition-transform active:scale-[0.98]"
          >
            <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting Location...' : 'Search Near My Current Location'}</span>
            <ExternalLink className="w-4 h-4 opacity-75" />
          </button>

          {geoStatus && (
            <p className="text-xs text-amber-300 font-mono">{geoStatus}</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span>OR SEARCH BY CITY / ZIP</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        {/* Manual City Form */}
        <form onSubmit={handleSearchByQuery} className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter City, State, or Postal Code..."
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-semibold border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Search</span>
          </button>
        </form>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {[
            'Dermatologists near me',
            'Pediatric Dermatologist',
            'Skin Clinic & Allergy Specialist',
            'Urgent Care Skin Lesion'
          ].map((tag, i) => (
            <button
              key={i}
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(tag)}`;
                window.open(mapsUrl, '_blank');
              }}
              className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 transition-colors"
            >
              <span>{tag}</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </button>
          ))}
        </div>

      </div>

      {/* Appointment Checklist Card */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 text-left space-y-3 text-xs text-slate-300">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>What to Bring to Your Dermatologist Appointment</span>
        </h3>
        <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
          <li>Saved SkinScan AI scan photos and observation reports.</li>
          <li>Timeline notes of when the skin spot or rash first appeared.</li>
          <li>List of current skin creams, soaps, and oral medications.</li>
          <li>Information on known family history of skin allergies or conditions.</li>
        </ul>
      </div>

    </div>
  );
}
