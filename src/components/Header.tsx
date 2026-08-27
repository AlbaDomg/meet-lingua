'use client';

import React from 'react';
import { Bot, Key, History, Sparkles, Languages, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenApiKeyModal,
  hasCustomKey,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-violet p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-background/90 rounded-[10px] flex items-center justify-center">
              <Languages className="w-5 h-5 text-brand-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Meetlingua <span className="text-gradient">AI</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                v1.0 DE → ES
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Captura, transcripción Whisper & informe técnico con GPT-4o
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* AI Engine Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/60 border border-white/5 text-xs text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-accent-amber animate-pulse" />
            <span>Whisper-1 + GPT-4o</span>
          </div>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              hasCustomKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-gray-800/70 border-white/10 text-gray-300 hover:bg-gray-700/80 hover:text-white'
            }`}
            title="Configurar Clave API de OpenAI"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasCustomKey ? 'API Key Personal' : 'API Key'}
            </span>
            {hasCustomKey ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400/80" />
            )}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-800/70 border border-white/10 text-gray-300 hover:bg-gray-700/80 hover:text-white transition-all"
          >
            <History className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Historial</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
