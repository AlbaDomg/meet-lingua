'use client';

import React from 'react';
import { Loader2, Mic, FileText, Brain, CheckCircle2, Sparkles, AlertCircle, RefreshCw, Key, X } from 'lucide-react';
import { ProcessingStep } from '@/lib/types';

interface ProcessingOverlayProps {
  step: ProcessingStep;
  message: string;
  error?: string;
  onDismiss?: () => void;
  onOpenApiKeyModal?: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  step,
  message,
  error,
  onDismiss,
  onOpenApiKeyModal,
}) => {
  if (step === 'idle' || step === 'completed') {
    return null;
  }

  // Error modal state
  if (step === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8 border border-rose-500/30 bg-gray-950/90 text-center shadow-2xl relative overflow-hidden animate-fade-in">
          {/* Ambient red glow */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-rose-600/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-2 mx-auto flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Ocurrió un inconveniente al procesar
            </h3>

            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-200 text-xs text-left leading-relaxed max-h-48 overflow-y-auto">
              {error || 'No se pudo completar el procesamiento del audio.'}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configurar Key</span>
                </button>
              )}

              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cerrar y Reintentar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepsList = [
    { id: 'uploading', label: 'Cargando y Preparando Audio', icon: Mic },
    { id: 'transcribing', label: 'Transcripción Whisper', icon: FileText },
    { id: 'analyzing', label: 'Análisis & Traducción GPT-4o', icon: Brain },
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
