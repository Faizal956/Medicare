
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, AlertCircle, HelpCircle, WifiOff, Clock, Bell, MapPin, ScanLine, Trash2, Pill, ShieldAlert, User as UserIcon, LogOut, History } from 'lucide-react';
import { AppState, Language, MedicineAnalysis, Voice, Tab, Reminder, InteractionResult, MedicineRecord, UserProfile } from './types';
import { LANGUAGES, AI_VOICES, UI_TRANSLATIONS, PROFILE_COLORS } from './constants';
import { GeminiService } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import * as db from './services/supabaseService';
import LoginPage from './components/LoginPage';
import LanguageSelector from './components/LanguageSelector';
import VoiceSelector from './components/VoiceSelector';
import AnalysisResult from './components/AnalysisResult';
import RemindersManager from './components/RemindersManager';
import PharmacyLocator from './components/PharmacyLocator';
import ProfileManager from './components/ProfileManager';
import ScanHistory from './components/ScanHistory';

const App: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<db.DbScanEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(AI_VOICES[0]);
  const [analysis, setAnalysis] = useState<MedicineAnalysis | null>(null);
  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{title: string, message: string, icon: React.ReactNode} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = UI_TRANSLATIONS[selectedLanguage.code] || UI_TRANSLATIONS.en;

  // =============================================
  // LOAD DATA FROM SUPABASE
  // =============================================

  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setActiveProfileId(null);
      setScanHistory([]);
      setDataLoading(false);
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      try {
        // Load profiles with their medications and reminders
        const dbProfiles = await db.getProfiles(user.id);
        
        const fullProfiles: UserProfile[] = await Promise.all(
          dbProfiles.map(async (p) => {
            const meds = await db.getMedications(p.id);
            const rems = await db.getReminders(p.id);
            return {
              id: p.id,
              name: p.name,
              color: p.color,
              preferredLanguageCode: p.preferred_language_code,
              preferredVoiceId: p.preferred_voice_id,
              medications: meds.map(m => ({ id: m.id, name: m.name, addedAt: new Date(m.added_at).getTime() })),
              reminders: rems.map(r => ({ id: r.id, medicineName: r.medicine_name, dosage: r.dosage || '', time: r.time, active: r.active })),
            };
          })
        );

        setProfiles(fullProfiles);

        const lastActiveId = localStorage.getItem('medi_active_profile_id');
        if (lastActiveId && fullProfiles.find(p => p.id === lastActiveId)) {
          setActiveProfileId(lastActiveId);
        } else if (fullProfiles.length > 0) {
          setActiveProfileId(fullProfiles[0].id);
        } else {
          setActiveTab('profile');
        }

        // Load scan history
        const history = await db.getScanHistory(user.id);
        setScanHistory(history);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (activeProfile) {
      const lang = LANGUAGES.find(l => l.code === activeProfile.preferredLanguageCode) || LANGUAGES[0];
      const voice = AI_VOICES.find(v => v.id === activeProfile.preferredVoiceId) || AI_VOICES[0];
      setSelectedLanguage(lang);
      setSelectedVoice(voice);
    }
  }, [activeProfileId]);

  // =============================================
  // PROFILE MANAGEMENT (Supabase)
  // =============================================

  const handleLanguageChange = async (lang: Language) => {
    setSelectedLanguage(lang);
    if (activeProfile && user) {
      try {
        await db.updateProfile(activeProfile.id, {
          preferred_language_code: lang.code,
          preferred_voice_id: lang.voiceName,
        });
        setProfiles(prev => prev.map(p =>
          p.id === activeProfileId ? { ...p, preferredLanguageCode: lang.code, preferredVoiceId: lang.voiceName } : p
        ));
      } catch (err) { console.error('Failed to update language:', err); }
    }
  };

  const handleVoiceChange = async (voice: Voice) => {
    setSelectedVoice(voice);
    if (activeProfile && user) {
      try {
        await db.updateProfile(activeProfile.id, { preferred_voice_id: voice.id });
        setProfiles(prev => prev.map(p =>
          p.id === activeProfileId ? { ...p, preferredVoiceId: voice.id } : p
        ));
      } catch (err) { console.error('Failed to update voice:', err); }
    }
  };

  const handleCreateProfile = async (name: string, langCode: string) => {
    if (!user) return;
    try {
      const defaultVoiceId = LANGUAGES.find(l => l.code === langCode)?.voiceName || AI_VOICES[0].id;
      const created = await db.saveProfile(user.id, {
        name,
        color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
        preferredLanguageCode: langCode,
        preferredVoiceId: defaultVoiceId,
      });
      const newProfile: UserProfile = {
        id: created.id,
        name: created.name,
        color: created.color,
        preferredLanguageCode: created.preferred_language_code,
        preferredVoiceId: created.preferred_voice_id,
        medications: [],
        reminders: [],
      };
      setProfiles(prev => [...prev, newProfile]);
      setActiveProfileId(newProfile.id);
      setActiveTab('scan');
    } catch (err) { console.error('Failed to create profile:', err); }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await db.deleteProfile(id);
      const updated = profiles.filter(p => p.id !== id);
      setProfiles(updated);
      if (activeProfileId === id) {
        setActiveProfileId(updated.length > 0 ? updated[0].id : null);
        if (updated.length === 0) setActiveTab('profile');
      }
    } catch (err) { console.error('Failed to delete profile:', err); }
  };

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    localStorage.setItem('medi_active_profile_id', id);
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setInteractionResult(null);
  };

  // =============================================
  // MEDICINE SCANNING (with Supabase persistence)
  // =============================================

  const processImage = useCallback(async (base64: string) => {
    if (!activeProfile || !user) {
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

      // Save scan to history (non-blocking)
      try {
        let imagePath: string | undefined;
        if (capturedImageBase64) {
          imagePath = await db.uploadMedicineImage(user.id, capturedImageBase64);
        }
        const entry = await db.saveScanEntry({
          userId: user.id,
          profileId: activeProfile.id,
          profileName: activeProfile.name,
          medicineName: medicineInfo.name,
          analysis: medicineInfo,
          imagePath,
        });
        setScanHistory(prev => [entry, ...prev]);
      } catch (historyErr) {
        console.error('Failed to save scan history:', historyErr);
      }
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
  }, [selectedLanguage, activeProfile, t, user, capturedImageBase64]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setCapturedImage(reader.result as string);
        setCapturedImageBase64(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // =============================================
  // MEDICATIONS & REMINDERS (Supabase)
  // =============================================

  const handleSetAlarm = async (name: string, dosage: string) => {
    if (!activeProfile) return;
    try {
      const created = await db.addReminder(activeProfile.id, {
        medicineName: name,
        dosage,
        time: "09:00",
      });
      const newReminder: Reminder = {
        id: created.id,
        medicineName: created.medicine_name,
        dosage: created.dosage || '',
        time: created.time,
        active: created.active,
      };
      setProfiles(prev => prev.map(p =>
        p.id === activeProfileId ? { ...p, reminders: [...p.reminders, newReminder] } : p
      ));
      setActiveTab('reminders');
    } catch (err) { console.error('Failed to add reminder:', err); }
  };

  const handleAddToMeds = async (name: string) => {
    if (!activeProfile) return;
    if (activeProfile.medications.some(m => m.name.toLowerCase() === name.toLowerCase())) return;
    
    try {
      const created = await db.addMedication(activeProfile.id, name);
      const newMed: MedicineRecord = {
        id: created.id,
        name: created.name,
        addedAt: new Date(created.added_at).getTime(),
      };
      setProfiles(prev => prev.map(p =>
        p.id === activeProfileId ? { ...p, medications: [...p.medications, newMed] } : p
      ));
    } catch (err) { console.error('Failed to add medication:', err); }
  };

  const removeMed = async (id: string) => {
    try {
      await db.removeMedication(id);
      setProfiles(prev => prev.map(p =>
        p.id === activeProfileId ? { ...p, medications: p.medications.filter(m => m.id !== id) } : p
      ));
    } catch (err) { console.error('Failed to remove medication:', err); }
  };

  const deleteReminderHandler = async (id: string) => {
    try {
      await db.deleteReminder(id);
      setProfiles(prev => prev.map(p =>
        p.id === activeProfileId ? { ...p, reminders: p.reminders.filter(r => r.id !== id) } : p
      ));
    } catch (err) { console.error('Failed to delete reminder:', err); }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setInteractionResult(null);
    setCapturedImage(null);
    setCapturedImageBase64(null);
  };

  // =============================================
  // AUTH GATE
  // =============================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage t={t} />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 pt-8 pb-32 md:py-12 safe-area-inset">
      <header className="w-full max-w-lg mb-8 text-center transition-all select-none">
        <div className="flex justify-end mb-2">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
          >
            <LogOut size={14} /> {t.logout}
          </button>
        </div>
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
            <RemindersManager reminders={activeProfile.reminders} onDelete={deleteReminderHandler} t={t} />
          </div>
        )}

        {activeTab === 'pharmacies' && (
          <PharmacyLocator t={t} />
        )}

        {activeTab === 'history' && (
          <ScanHistory scanHistory={scanHistory} t={t} />
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-3 pb-safe-area flex justify-around items-center z-50 md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:mb-6 md:rounded-3xl md:border md:shadow-xl">
        {[
          { id: 'scan', icon: ScanLine, label: t.tabScan },
          { id: 'reminders', icon: Bell, label: t.tabReminders },
          { id: 'history', icon: History, label: t.tabHistory },
          { id: 'pharmacies', icon: MapPin, label: t.tabPharmacies },
          { id: 'profile', icon: UserIcon, label: t.tabProfile }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center gap-1.5 p-2 px-3 rounded-2xl transition-all active:scale-90 ${
              activeTab === item.id 
                ? 'text-blue-600 bg-blue-50/50' 
                : 'text-slate-400'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
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
