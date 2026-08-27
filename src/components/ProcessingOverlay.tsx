'use client';

import React from 'react';
import { Loader2, Mic, FileText, Brain, CheckCircle2, Sparkles } from 'lucide-react';
import { ProcessingStep } from '@/lib/types';

interface ProcessingOverlayProps {
  step: ProcessingStep;
  message: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ step, message }) => {
  if (step === 'idle' || step === 'completed' || step === 'error') {
    return null;
  }

  const stepsList = [
    { id: 'uploading', label: 'Cargando Audio', icon: Mic },
    { id: 'transcribing', label: 'Transcripción Whisper (Alemán)', icon: FileText },
    { id: 'analyzing', label: 'Análisis & Traducción GPT-4o (Español)', icon: Brain },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['idle', 'uploading', 'transcribing', 'analyzing', 'completed'];
    const currentIndex = order.indexOf(step);
    const stepIndex = order.indexOf(stepId);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-white/10 text-center shadow-2xl relative overflow-hidden">
        
        {/* Glow accent in background */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-brand-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-accent-violet/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-violet p-0.5 mx-auto mb-6 shadow-xl shadow-brand-500/30 animate-pulse-glow">
            <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center text-brand-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <span>Procesando Reunión con IA</span>
            <Sparkles className="w-4 h-4 text-accent-amber animate-bounce" />
          </h3>

          <p className="text-xs text-gray-400 mb-8 min-h-[32px]">
            {message || 'Analizando audio con alta fidelidad...'}
          </p>

          {/* Stepper tracker */}
          <div className="space-y-4 text-left">
            {stepsList.map((item) => {
              const status = getStepStatus(item.id);
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    status === 'active'
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-300 shadow-md shadow-brand-500/10'
                      : status === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-gray-900/40 border-white/5 text-gray-500'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : status === 'active' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                    ) : (
                      <Icon className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-gray-500">
            Optimizando transcripción multilingüe en alemán y traduciendo terminología técnica al español.
          </div>
        </div>
      </div>
    </div>
  );
};
