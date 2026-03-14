import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Pill, Image as ImageIcon, User } from 'lucide-react';
import type { DbScanEntry } from '../services/supabaseService';
import { getMedicineImageUrl } from '../services/supabaseService';

interface ScanHistoryProps {
  scanHistory: DbScanEntry[];
  t: any;
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ scanHistory, t }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 px-1">
        <Clock className="text-blue-600" size={20} />
        {t.historyTitle || 'Scan History'}
      </h2>

      {scanHistory.length === 0 ? (
        <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm italic space-y-2">
          <Clock size={32} className="mx-auto text-slate-300" />
          <p>{t.noHistory || 'No scans yet. Scan a medicine to see your history here.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scanHistory.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const analysis = entry.analysis;

            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {entry.image_path ? (
                      <img
                        src={getMedicineImageUrl(entry.image_path)}
                        alt={entry.medicine_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                        }}
                      />
                    ) : (
                      <Pill className="text-blue-400" size={20} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{entry.medicine_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.profile_name && (
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <User size={8} /> {entry.profile_name}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDate(entry.scanned_at)}
                      </span>
                    </div>
                  </div>

                  {/* Expand */}
                  <div className="text-slate-300">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && analysis && (
                  <div className="px-4 pb-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200 border-t border-slate-50">
                    {entry.image_path && (
                      <div className="rounded-xl overflow-hidden bg-slate-100 max-h-48">
                        <img
                          src={getMedicineImageUrl(entry.image_path)}
                          alt={entry.medicine_name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.dosage || 'Dosage'}</span>
                        <span className="font-bold text-slate-700 text-xs">{analysis.dosage}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t.frequency || 'Frequency'}</span>
                        <span className="font-bold text-slate-700 text-xs">{analysis.frequency}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t.instructions || 'Instructions'}</span>
                      <span className="text-slate-600 text-xs leading-relaxed">{analysis.instructions}</span>
                    </div>
                    {analysis.sideEffects && analysis.sideEffects.length > 0 && (
                      <div className="bg-amber-50/50 p-3 rounded-xl text-sm">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">{t.sideEffects || 'Side Effects'}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.sideEffects.map((se: string, i: number) => (
                            <span key={i} className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg">{se}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
