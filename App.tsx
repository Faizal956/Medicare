
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, AlertCircle, HelpCircle, WifiOff, Clock, Bell, MapPin, ScanLine, Trash2, Pill, ShieldAlert, User as UserIcon } from 'lucide-react';
import { AppState, Language, MedicineAnalysis, Voice, Tab, Reminder, InteractionResult, MedicineRecord, UserProfile } from './types';
import { LANGUAGES, AI_VOICES, UI_TRANSLATIONS, PROFILE_COLORS } from './constants';
import { GeminiService } from './services/geminiService';
import LanguageSelector from './components/LanguageSelector';
import VoiceSelector from './components/VoiceSelector';
import AnalysisResult from './components/AnalysisResult';
import RemindersManager from './components/RemindersManager';
import PharmacyLocator from './components/PharmacyLocator';
import ProfileManager from './components/ProfileManager';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(AI_VOICES[0]);
  const [analysis, setAnalysis] = useState<MedicineAnalysis | null>(null);
  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{title: string, message: string, icon: React.ReactNode} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = UI_TRANSLATIONS[selectedLanguage.code] || UI_TRANSLATIONS.en;

  useEffect(() => {
    const savedProfiles = localStorage.getItem('medi_profiles_v2');
    const lastActiveId = localStorage.getItem('medi_active_profile_id');
    
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles) as UserProfile[];
      setProfiles(parsed);
      
      if (lastActiveId && parsed.find(p => p.id === lastActiveId)) {
        setActiveProfileId(lastActiveId);
      } else if (parsed.length > 0) {
        setActiveProfileId(parsed[0].id);
      } else {
        setActiveTab('profile');
      }
    } else {
      setActiveTab('profile');
    }
  }, []);

  useEffect(() => {
    if (activeProfile) {
      const lang = LANGUAGES.find(l => l.code === activeProfile.preferredLanguageCode) || LANGUAGES[0];
      const voice = AI_VOICES.find(v => v.id === activeProfile.preferredVoiceId) || AI_VOICES[0];
      setSelectedLanguage(lang);
      setSelectedVoice(voice);
    }
  }, [activeProfileId]);

  const updateProfilesAndPersist = (newProfiles: UserProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('medi_profiles_v2', JSON.stringify(newProfiles));
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
    if (activeProfile) {
      const updated = profiles.map(p => 
        p.id === activeProfileId ? { 
          ...p, 
          preferredLanguageCode: lang.code,
          preferredVoiceId: lang.voiceName
        } : p
      );
      updateProfilesAndPersist(updated);
    }
  };

  const handleVoiceChange = (voice: Voice) => {
    setSelectedVoice(voice);
    if (activeProfile) {
      const updated = profiles.map(p => 
        p.id === activeProfileId ? { ...p, preferredVoiceId: voice.id } : p
      );
      updateProfilesAndPersist(updated);
    }
  };

  const handleCreateProfile = (name: string, langCode: string) => {
    const defaultVoiceId = LANGUAGES.find(l => l.code === langCode)?.voiceName || AI_VOICES[0].id;
    const newProfile: UserProfile = {
      id: Date.now().toString(),
      name,
      color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
      preferredLanguageCode: langCode,
      preferredVoiceId: defaultVoiceId,
      medications: [],
      reminders: []
    };
    const updated = [...profiles, newProfile];
    updateProfilesAndPersist(updated);
    setActiveProfileId(newProfile.id);
    setActiveTab('scan');
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    updateProfilesAndPersist(updated);
    if (activeProfileId === id) {
      setActiveProfileId(updated.length > 0 ? updated[0].id : null);
      if (updated.length === 0) setActiveTab('profile');
    }
  };

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    localStorage.setItem('medi_active_profile_id', id);
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setInteractionResult(null);
  };

  const processImage = useCallback(async (base64: string) => {
    if (!activeProfile) {
      setActiveTab('profile');
      return;
    }

    setAppState(AppState.ANALYZING);
    setErrorDetails(null);
    setInteractionResult(null);
    setAnalysis(null);

    if (!navigator.onLine) {
      setErrorDetails({ title: "No Internet", message: "Check your network connection.", icon: <WifiOff size={32} /> });
      setAppState(AppState.ERROR);
      return;
    }

    try {
      const gemini = new GeminiService();
      const medicineInfo = await gemini.analyzeImage(base64, selectedLanguage.name);
      setAnalysis(medicineInfo);
      
      setAppState(AppState.CHECKING_INTERACTIONS);
      const currentMedicationNames = activeProfile.medications.map(m => m.name);
      
      if (currentMedicationNames.length > 0) {
        const interactionCheck = await gemini.checkInteractions(
          medicineInfo.name, 
          currentMedicationNames, 
          selectedLanguage.name
        );
        setInteractionResult(interactionCheck);
      } else {
        setInteractionResult({ hasConflict: false, severity: 'none', explanation: '', recommendation: '' });
      }
      
      setAppState(AppState.RESULT);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      setAppState(AppState.ERROR);
      setErrorDetails({ 
        title: error.message === "IMAGE_UNREADABLE" ? t.unclearImage : t.processingError, 
        message: error.message === "IMAGE_UNREADABLE" 
          ? "The text on the medicine is hard to read. Please try again with better lighting." 
          : "Analysis failed. Please try again.", 
        icon: <AlertCircle size={32} /> 
      });
    }
  }, [selectedLanguage, activeProfile, t]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setCapturedImage(reader.result as string);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetAlarm = (name: string, dosage: string) => {
    if (!activeProfile) return;
    const newReminder: Reminder = {
      id: Date.now().toString(),
      medicineName: name,
      dosage: dosage,
      time: "09:00",
      active: true
    };
    const updated = profiles.map(p => 
      p.id === activeProfileId ? { ...p, reminders: [...p.reminders, newReminder] } : p
    );
    updateProfilesAndPersist(updated);
    setActiveTab('reminders');
  };

  const handleAddToMeds = (name: string) => {
    if (!activeProfile) return;
    if (activeProfile.medications.some(m => m.name.toLowerCase() === name.toLowerCase())) return;
    
    const newMed: MedicineRecord = {
      id: Date.now().toString(),
      name: name,
      addedAt: Date.now()
    };
    const updated = profiles.map(p => 
      p.id === activeProfileId ? { ...p, medications: [...p.medications, newMed] } : p
    );
    updateProfilesAndPersist(updated);
  };

  const removeMed = (id: string) => {
    const updated = profiles.map(p => 
      p.id === activeProfileId ? { ...p, medications: p.medications.filter(m => m.id !== id) } : p
    );
    updateProfilesAndPersist(updated);
  };

  const deleteReminder = (id: string) => {
    const updated = profiles.map(p => 
      p.id === activeProfileId ? { ...p, reminders: p.reminders.filter(r => r.id !== id) } : p
    );
    updateProfilesAndPersist(updated);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setInteractionResult(null);
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 pt-8 pb-32 md:py-12 safe-area-inset">
      <header className="w-full max-w-lg mb-8 text-center transition-all select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4">
          <Sparkles size={14} /> {t.tagline}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1 tracking-tight flex flex-wrap justify-center items-center gap-2">
          Medi-Remind
          {activeProfile && (
            <span className="text-blue-500 text-xl md:text-2xl font-medium bg-blue-50 px-3 py-1 rounded-2xl border border-blue-100">
              {t.for} {activeProfile.name}
            </span>
          )}
        </h1>
        <p className="text-slate-500 text-sm font-medium">{t.subtitle}</p>
      </header>

      <main className="w-full max-w-lg space-y-6">
        {activeTab === 'scan' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            {appState === AppState.IDLE && (
              <>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                  <LanguageSelector selectedLanguage={selectedLanguage} onSelect={handleLanguageChange} t={t} />
                  <div className="pt-4 border-t border-slate-100">
                    <VoiceSelector selectedVoice={selectedVoice} onSelect={handleVoiceChange} currentLanguage={selectedLanguage} t={t} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-3xl p-8 flex flex-col items-center cursor-pointer transition-all shadow-xl shadow-blue-100 group"
                  >
                    <div className="bg-white/20 p-5 rounded-full mb-6 transition-transform group-hover:scale-110">
                      <Camera size={56} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{t.scanMedicine}</h3>
                    <p className="text-blue-100 text-center text-base md:text-lg">{t.scanDesc}</p>
                  </div>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white active:scale-[0.98] text-slate-700 border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-3 font-bold hover:bg-slate-50 transition-all"
                  >
                    <Upload size={20} /> {t.uploadPhoto}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment" 
                  />
                </div>
              </>
            )}

            {(appState === AppState.ANALYZING || appState === AppState.CHECKING_INTERACTIONS) && (
              <div className="bg-white rounded-3xl p-10 md:p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {appState === AppState.CHECKING_INTERACTIONS ? (
                      <ShieldAlert className="text-blue-600 animate-pulse" size={28} />
                    ) : (
                      <Clock className="text-blue-600" size={28} />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {appState === AppState.CHECKING_INTERACTIONS ? t.checkingInteractions : t.readingMedicine}
                </h3>
                <p className="text-slate-400 text-xs max-w-[200px]">
                  {appState === AppState.CHECKING_INTERACTIONS ? t.interactionPulse : t.readingPulse}
                </p>
              </div>
            )}

            {appState === AppState.RESULT && analysis && (
              <div className="space-y-6">
                <AnalysisResult 
                  analysis={analysis} 
                  interactionResult={interactionResult}
                  language={selectedLanguage} 
                  voice={selectedVoice} 
                  t={t} 
                  onSetAlarm={handleSetAlarm}
                  onAddToMeds={handleAddToMeds}
                  isAlreadyInMeds={activeProfile?.medications.some(m => m.name.toLowerCase() === analysis.name.toLowerCase()) || false}
                />
                <button 
                  onClick={resetApp} 
                  className="w-full py-4 bg-slate-100 active:scale-[0.98] text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> {t.scanAnother}
                </button>
              </div>
            )}

            {appState === AppState.ERROR && errorDetails && (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center space-y-6 animate-in zoom-in duration-300">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-500">{errorDetails.icon}</div>
                <h3 className="text-xl font-bold text-slate-900">{errorDetails.title}</h3>
                <p className="text-slate-500 text-sm">{errorDetails.message}</p>
                <button onClick={resetApp} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold active:scale-[0.98]">{t.tryAgain}</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reminders' && activeProfile && (
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2 px-1">
                <Pill className="text-blue-600" size={20} />
                {t.myMedsTitle}
              </h2>
              {activeProfile.medications.length === 0 ? (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm italic">
                  {t.addMedsHint}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {activeProfile.medications.map(med => (
                    <div key={med.id} className="bg-white px-4 py-3.5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
                      <span className="font-bold text-slate-700">{med.name}</span>
                      <button onClick={() => removeMed(med.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <RemindersManager reminders={activeProfile.reminders} onDelete={deleteReminder} t={t} />
          </div>
        )}

        {activeTab === 'pharmacies' && (
          <PharmacyLocator t={t} />
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {!activeProfile && (
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-4 animate-in slide-in-from-top-4 duration-300">
                  <LanguageSelector selectedLanguage={selectedLanguage} onSelect={setSelectedLanguage} t={t} />
               </div>
            )}
            <ProfileManager 
              profiles={profiles} 
              activeProfileId={activeProfileId}
              onSelect={handleSwitchProfile}
              onCreate={handleCreateProfile}
              onDelete={handleDeleteProfile}
              t={t}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation: High Mobile Reachability */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-safe-area flex justify-around items-center z-50 md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:mb-6 md:rounded-3xl md:border md:shadow-xl">
        {[
          { id: 'scan', icon: ScanLine, label: t.tabScan },
          { id: 'reminders', icon: Bell, label: t.tabReminders },
          { id: 'pharmacies', icon: MapPin, label: t.tabPharmacies },
          { id: 'profile', icon: UserIcon, label: t.tabProfile }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center gap-1.5 p-2 px-4 rounded-2xl transition-all active:scale-90 ${
              activeTab === item.id 
                ? 'text-blue-600 bg-blue-50/50' 
                : 'text-slate-400'
            }`}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <footer className="mt-auto pt-8 pb-10 text-center max-w-md">
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3 text-left">
          <HelpCircle className="text-blue-400 shrink-0" size={18} />
          <p className="text-[10px] text-blue-800/70 leading-relaxed font-medium">{t.warning}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
