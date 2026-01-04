
import React, { useState, useEffect } from 'react';
import { PharmacyLocation } from '../types';
import { GeminiService } from '../services/geminiService';
import { MapPin, Map as MapIcon, Loader2, Navigation, AlertCircle, RefreshCw } from 'lucide-react';

interface PharmacyLocatorProps {
  t: any;
}

const PharmacyLocator: React.FC<PharmacyLocatorProps> = ({ t }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<PharmacyLocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacies = async () => {
    setLoading(true);
    setError(null);
    setLocations([]);
    
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }

      const geoOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const gemini = new GeminiService();
            const nearby = await gemini.findNearbyPharmacies(pos.coords.latitude, pos.coords.longitude);
            
            if (nearby.length === 0) {
              setError("No pharmacies found in your immediate area.");
            } else {
              setLocations(nearby);
            }
            setLoading(false);
          } catch (e: any) {
            console.error("Gemini Pharmacy Error:", e);
            setError("Could not retrieve pharmacy details. Please check your connection.");
            setLoading(false);
          }
        },
        (err) => {
          console.error("Geolocation Error:", err);
          let msg = "Could not get your location.";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Location access was denied. Please enable location permissions in your browser settings.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = "Location information is currently unavailable.";
          } else if (err.code === err.TIMEOUT) {
            msg = "Location request timed out. Please try again.";
          }
          setError(msg);
          setLoading(false);
        },
        geoOptions
      );
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapIcon className="text-green-600" size={24} />
          {t.nearbyPharmacies}
        </h2>
        <button 
          onClick={fetchPharmacies}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 space-y-4 shadow-sm border border-slate-100">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={48} />
          <p className="font-medium">{t.findingPharmacies}</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm text-center space-y-4">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-slate-600 font-medium px-4">{error}</p>
          <button 
            onClick={fetchPharmacies}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {locations.map((loc, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex gap-3">
                <div className="bg-green-50 text-green-600 p-3 rounded-xl h-fit">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight">{loc.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Medical Store</p>
                </div>
              </div>
              <a 
                href={loc.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-bold shrink-0"
              >
                <Navigation size={18} />
                <span className="hidden sm:inline text-xs">{t.openInMaps}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyLocator;
