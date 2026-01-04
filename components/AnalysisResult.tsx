
import React, { useState } from 'react';
import { MedicineAnalysis, Language, Voice, InteractionResult } from '../types';
import { Volume2, Info, Clock, Pill, ShieldAlert, Loader2, BellPlus, PlusCircle, CheckCircle } from 'lucide-react';
import { GeminiService, playPcmAudio } from '../services/geminiService';
import InteractionAlert from './InteractionAlert';

interface AnalysisResultProps {
  analysis: MedicineAnalysis;
  interactionResult: InteractionResult | null;
  language: Language;
  voice: Voice;
  t: any;
  onSetAlarm: (name: string, dosage: string) => void;
  onAddToMeds: (name: string) => void;
  isAlreadyInMeds: boolean;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ 
  analysis, 
  interactionResult,
  language, 
  voice, 
  t, 
  onSetAlarm, 
  onAddToMeds,
  isAlreadyInMeds
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const handlePlayAudio = async () => {
    if (isPlaying || loadingAudio) return;
    setLoadingAudio(true);
    try {
      const gemini = new GeminiService();
      const base64Audio = await gemini.generateSpeech(analysis.translatedText, voice.id);
      setIsPlaying(true);
      const source = await playPcmAudio(base64Audio);
      source.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {interactionResult && <InteractionAlert result={interactionResult} t={t} />}

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold mb-1 break-words leading-tight">{analysis.name}</h2>
              <p className="opacity-90 flex items-center gap-2 text-sm font-medium">
                <Info size={14} /> {analysis.purpose}
              </p>
            </div>
            <button
              onClick={handlePlayAudio}
              disabled={loadingAudio}
              className={`p-4 rounded-full transition-all flex items-center justify-center shrink-0 ${
                isPlaying 
                  ? 'bg-white/20 scale-110 ring-4 ring-white/10' 
                  : 'bg-white/20 hover:bg-white/30 active:scale-95'
              }`}
            >
              {loadingAudio ? <Loader2 className="animate-spin" size={28} /> : <Volume2 size={28} />}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl flex flex-col items-center text-center">
              <Pill className="text-blue-600 mb-2" size={24} />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{t.dosage}</span>
              <span className="text-base font-bold text-slate-800 leading-tight">{analysis.dosage}</span>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl flex flex-col items-center text-center">
              <Clock className="text-indigo-600 mb-2" size={24} />
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{t.frequency}</span>
              <span className="text-base font-bold text-slate-800 leading-tight">{analysis.frequency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onSetAlarm(analysis.name, analysis.dosage)}
              className="py-4 bg-orange-100 text-orange-700 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-orange-200 transition-colors border border-orange-200"
            >
              <BellPlus size={20} />
              <span className="text-xs">{t.setAlarm}</span>
            </button>
            <button 
              onClick={() => onAddToMeds(analysis.name)}
              disabled={isAlreadyInMeds}
              className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all border ${
                isAlreadyInMeds 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              {isAlreadyInMeds ? <CheckCircle size={20} /> : <PlusCircle size={20} />}
              <span className="text-xs">{isAlreadyInMeds ? t.addedToMeds : t.addToMyMeds}</span>
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShieldAlert size={14} className="text-orange-500" /> {t.instructions}
            </h3>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-700 italic font-medium">
              "{analysis.instructions}"
            </div>
          </div>

          {analysis.sideEffects.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">{t.sideEffects}</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.sideEffects.map((effect, i) => (
                  <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
