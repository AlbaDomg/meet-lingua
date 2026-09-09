'use client';

import React from 'react';
import { AudioLanguage } from '@/lib/types';
import { Volume2 } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: AudioLanguage;
  onSelectLanguage: (lang: AudioLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  const options: { id: AudioLanguage; label: string; flag: string; sublabel: string }[] = [
    {
      id: 'de',
      label: 'Alemán',
      flag: '🇩🇪',
      sublabel: 'Traduce y genera informe en ES',
    },
    {
      id: 'es',
      label: 'Español',
      flag: '🇪🇸',
      sublabel: 'Sin traducción | Informe en ES',
    },
    {
      id: 'auto',
      label: 'Auto-detectar',
      flag: '🌐',
      sublabel: 'Whisper detecta | Informe en ES',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-brand-400" />
          Idioma del Audio de Origen
        </label>
        <span className="text-[11px] text-gray-500 hidden sm:inline">
          El informe siempre se genera 100% en español
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-950/60 border border-white/10 rounded-2xl backdrop-blur-md">
        {options.map((opt) => {
          const isSelected = selectedLanguage === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectLanguage(opt.id)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all text-center ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-gradient-to-b from-brand-600/90 to-brand-700/90 text-white shadow-lg shadow-brand-600/25 border border-brand-400/40 font-medium'
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5 text-base sm:text-lg mb-0.5">
                <span>{opt.flag}</span>
                <span className="font-semibold text-xs sm:text-sm text-white">
                  {opt.label}
                </span>
              </div>
              <span className="text-[10px] font-normal text-gray-300 opacity-90 leading-tight hidden xs:block">
                {opt.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
