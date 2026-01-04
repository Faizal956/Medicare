
import React from 'react';
import { LANGUAGES } from '../constants';
import { Language } from '../types';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelect: (lang: Language) => void;
  t: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelect, t }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-500 flex items-center gap-2">
        <Globe size={16} /> {t.selectLanguage}
      </label>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
              selectedLanguage.code === lang.code
                ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-600 ring-offset-2'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
