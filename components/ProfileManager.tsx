
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { User, Plus, Check, Trash2, Users, ChevronRight } from 'lucide-react';
import { PROFILE_COLORS, LANGUAGES } from '../constants';

interface ProfileManagerProps {
  profiles: UserProfile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, langCode: string) => void;
  onDelete: (id: string) => void;
  t: any;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, activeProfileId, onSelect, onCreate, onDelete, t }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLangCode, setNewLangCode] = useState(LANGUAGES[0].code);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName, newLangCode);
      setNewName('');
      setShowCreate(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-indigo-600" size={22} />
          {t.profilesTitle}
        </h2>
        {!showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 active:scale-90 transition-all shadow-sm"
          >
            <Plus size={22} />
          </button>
        )}
      </div>

      {showCreate ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-indigo-100 space-y-5 animate-in zoom-in-95 duration-200">
          <h3 className="font-bold text-slate-800 text-lg">{t.createProfile}</h3>
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              {t.profileName}
            </label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Mom, Dad"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-base transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              {t.selectLanguage}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => setNewLangCode(lang.code)}
                  className={`p-3.5 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                    newLangCode === lang.code 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setShowCreate(false)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all"
            >
              {t.goBack}
            </button>
            <button 
              onClick={handleCreate}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              {t.saveProfile}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {profiles.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 italic">
              {t.whoIsUsing}
            </div>
          ) : (
            profiles.map((profile) => (
              <div 
                key={profile.id}
                onClick={() => onSelect(profile.id)}
                className={`group relative bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between active:scale-[0.98] ${
                  activeProfileId === profile.id 
                  ? 'border-indigo-600 shadow-md shadow-indigo-50' 
                  : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-inner shrink-0 ${profile.color}`}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 leading-tight">
                      {profile.name}
                      {activeProfileId === profile.id && (
                        <span className="bg-indigo-600 text-white text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                          {t.active}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                      {LANGUAGES.find(l => l.code === profile.preferredLanguageCode)?.nativeName} • {profile.medications.length} meds
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this profile?')) onDelete(profile.id);
                    }}
                    className="p-3 text-slate-300 hover:text-red-500 active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileManager;
