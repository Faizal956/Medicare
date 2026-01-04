
import React, { useState } from 'react';
import { AI_VOICES } from '../constants';
import { Voice, Language } from '../types';
import { User, Play, Loader2, Star } from 'lucide-react';
import { GeminiService, playPcmAudio } from '../services/geminiService';

interface VoiceSelectorProps {
  selectedVoice: Voice;
  onSelect: (voice: Voice) => void;
  currentLanguage: Language;
  t: any;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelect, currentLanguage, t }) => {
  const [samplingVoiceId, setSamplingVoiceId] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<AudioBufferSourceNode | null>(null);

  const handlePlaySample = async (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation();
    
    if (samplingVoiceId === voice.id) {
      activeSource?.stop();
      setSamplingVoiceId(null);
      return;
    }

    activeSource?.stop();
    setSamplingVoiceId(voice.id);

    try {
      const gemini = new GeminiService();
      // Simple preview text
      const sampleText = `Hello, I am ${voice.name}.`;
      const base64Audio = await gemini.generateSpeech(sampleText, voice.id);
      const source = await playPcmAudio(base64Audio);
      
      setActiveSource(source);
      source.onended = () => {
        setSamplingVoiceId(null);
        setActiveSource(null);
      };
    } catch (error) {
      console.error("Sample playback error:", error);
      setSamplingVoiceId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
        <User size={16} /> {t.narratorVoice}
      </label>
      <div className="flex flex-wrap gap-3">
        {AI_VOICES.map((voice) => {
          const isRecommended = currentLanguage.voiceName === voice.id;
          return (
            <div
              key={voice.id}
              onClick={() => onSelect(voice)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border group ${
                selectedVoice.id === voice.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold leading-tight">{voice.name}</span>
                  {isRecommended && (
                    <span className={`flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                      selectedVoice.id === voice.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Star size={8} fill="currentColor" /> {t.bestFor} {currentLanguage.name}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium opacity-70 ${selectedVoice.id === voice.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {voice.persona}
                </span>
              </div>

              <button
                onClick={(e) => handlePlaySample(e, voice)}
                disabled={samplingVoiceId !== null && samplingVoiceId !== voice.id}
                className={`p-2 rounded-full transition-all border ${
                  selectedVoice.id === voice.id
                    ? 'bg-white/20 border-white/30 hover:bg-white/40 text-white'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
                } ${samplingVoiceId !== null && samplingVoiceId !== voice.id ? 'opacity-30' : 'opacity-100'}`}
                title="Play sample"
              >
                {samplingVoiceId === voice.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
              </button>
              
              {selectedVoice.id === voice.id && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white ring-2 ring-indigo-600/20"></div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 italic mt-1 flex items-center gap-1">
        <Play size={10} /> {t.voicePreviewHint}
      </p>
    </div>
  );
};

export default VoiceSelector;
