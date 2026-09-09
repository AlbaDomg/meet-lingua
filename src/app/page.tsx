'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DualAudioRecorder } from '@/components/DualAudioRecorder';
import { AudioDropzone } from '@/components/AudioDropzone';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';
import { ReportView } from '@/components/ReportView';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProcessedMeeting, ProcessingState, AudioLanguage } from '@/lib/types';
import { Mic, UploadCloud, Sparkles, AlertCircle, RefreshCw, Key } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>('de');
  const [history, setHistory] = useState<ProcessedMeeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<ProcessedMeeting | null>(null);

  const [processing, setProcessing] = useState<ProcessingState>({
    step: 'idle',
    progressMessage: '',
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Load key & history from localStorage on initial mount
  useEffect(() => {
    const savedKey = localStorage.getItem('meetlingua_custom_api_key');
    if (savedKey) setCustomApiKey(savedKey);

    const savedLang = localStorage.getItem('meetlingua_audio_language') as AudioLanguage | null;
    if (savedLang) setAudioLanguage(savedLang);

    const savedHistory = localStorage.getItem('meetlingua_meetings_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  const saveCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('meetlingua_custom_api_key', key);
    } else {
      localStorage.removeItem('meetlingua_custom_api_key');
    }
  };

  const saveAudioLanguage = (lang: AudioLanguage) => {
    setAudioLanguage(lang);
    localStorage.setItem('meetlingua_audio_language', lang);
  };

  const saveMeetingToHistory = (newMeeting: ProcessedMeeting) => {
    const updated = [newMeeting, ...history.filter((m) => m.id !== newMeeting.id)];
    setHistory(updated);
    localStorage.setItem('meetlingua_meetings_history', JSON.stringify(updated));
  };

  const deleteMeetingFromHistory = (id: string) => {
    const updated = history.filter((m) => m.id !== id);
    setHistory(updated);
    localStorage.setItem('meetlingua_meetings_history', JSON.stringify(updated));
    if (activeMeeting?.id === id) {
      setActiveMeeting(null);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('meetlingua_meetings_history');
    setActiveMeeting(null);
  };

  const handleAudioSubmit = async (audioBlob: Blob | File, durationSeconds: number = 0, fileName?: string) => {
    setProcessing({
      step: 'uploading',
      progressMessage: 'Preparando archivo de audio para procesamiento...',
    });

    try {
      const actualFile = audioBlob instanceof File 
        ? audioBlob 
        : new File([audioBlob], fileName || `reunion-${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });

      // Chunk file into 3.5MB slices to strictly respect Vercel's 4.5MB Serverless limit
      const CHUNK_SIZE = 3.5 * 1024 * 1024;
      const totalChunks = Math.ceil(actualFile.size / CHUNK_SIZE);
      let fullGermanTranscriptText = '';

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(actualFile.size, start + CHUNK_SIZE);
        const chunkBlob = actualFile.slice(start, end, actualFile.type || 'audio/webm');
        const chunkFile = new File([chunkBlob], `part_${i + 1}_${actualFile.name}`, { type: actualFile.type || 'audio/webm' });

        setProcessing({
          step: 'transcribing',
          progressMessage: totalChunks > 1 
            ? `Transcribiendo audio en alemán con Whisper (Parte ${i + 1} de ${totalChunks})...`
            : 'Transcribiendo audio en alemán con OpenAI Whisper (whisper-1)...',
        });

        const formData = new FormData();
        formData.append('audio', chunkFile);
        formData.append('audioLanguage', audioLanguage);
        if (customApiKey) {
          formData.append('customApiKey', customApiKey);
        }

        const langText = audioLanguage === 'de' ? 'en alemán' : audioLanguage === 'es' ? 'en español' : 'y detectando idioma';

        setProcessing({
          step: 'transcribing',
          progressMessage: totalChunks > 1 
            ? `Transcribiendo audio ${langText} con Whisper (Parte ${i + 1} de ${totalChunks})...`
            : `Transcribiendo audio ${langText} con OpenAI Whisper (whisper-1)...`,
        });

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: customApiKey ? { 'x-openai-key': customApiKey } : {},
          body: formData,
        });

        const contentType = response.headers.get('content-type') || '';
        let data: { error?: string; message?: string; text?: string } = {};

        if (contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch {
            const rawText = await response.text();
            throw new Error(`El servidor devolvió una respuesta no válida: ${rawText.slice(0, 100)}`);
          }
        } else {
          const textError = await response.text();
          throw new Error(`Error en el servidor (${response.status}): ${textError.slice(0, 150) || response.statusText}`);
        }

        if (!response.ok) {
          if (data.error === 'OPENAI_KEY_MISSING') {
            setIsApiKeyModalOpen(true);
            throw new Error('Falta la clave API de OpenAI. Por favor ingresa tu OpenAI API Key en los ajustes.');
          }
          throw new Error(data.message || data.error || 'Error al transcribir el fragmento de audio.');
        }

        if (data.text) {
          fullGermanTranscriptText += (fullGermanTranscriptText ? ' ' : '') + data.text;
        }
      }

      if (!fullGermanTranscriptText || fullGermanTranscriptText.trim().length === 0) {
        throw new Error('Whisper no pudo extraer audio audible o la grabación estaba en silencio.');
      }

      // Step 2: Summarize transcript with GPT-4o
      const analyzeMessage = audioLanguage === 'es'
        ? 'Analizando y estructurando informe de clase/reunión en español con GPT-4o...'
        : 'Analizando transcripción y traduciendo a informe en español con GPT-4o...';

      setProcessing({
        step: 'analyzing',
        progressMessage: analyzeMessage,
      });

      const summarizeResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-openai-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          germanTranscriptText: fullGermanTranscriptText,
          transcriptText: fullGermanTranscriptText,
          audioLanguage,
          customApiKey,
        }),
      });

      const sumContentType = summarizeResponse.headers.get('content-type') || '';
      let sumData: { error?: string; message?: string; informeEspanol?: ProcessedMeeting['informeEspanol'] } = {};

      if (sumContentType.includes('application/json')) {
        try {
          sumData = await summarizeResponse.json();
        } catch {
          const rawText = await summarizeResponse.text();
          throw new Error(`El servidor devolvió una respuesta no válida al generar informe: ${rawText.slice(0, 100)}`);
        }
      } else {
        const textError = await summarizeResponse.text();
        throw new Error(`Error en el servidor (${summarizeResponse.status}): ${textError.slice(0, 150) || summarizeResponse.statusText}`);
      }

      if (!summarizeResponse.ok) {
        if (sumData.error === 'OPENAI_KEY_MISSING') {
          setIsApiKeyModalOpen(true);
          throw new Error('Falta la clave API de OpenAI. Por favor ingresa tu OpenAI API Key en los ajustes.');
        }
        throw new Error(sumData.message || sumData.error || 'Error al analizar el informe con GPT-4o.');
      }

      const processedMeeting: ProcessedMeeting = {
        id: `meeting-${Date.now()}`,
        fechaCreacion: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        nombreArchivo: actualFile.name,
        modoCaptura: activeTab === 'record' ? 'grabacion' : 'subida',
        transcripcionAleman: fullGermanTranscriptText,
        transcripcionOriginal: fullGermanTranscriptText,
        idiomaAudio: audioLanguage,
        informeEspanol: sumData.informeEspanol!,
        duracionSegundos: durationSeconds,
      };

      // Save and set active
      saveMeetingToHistory(processedMeeting);
      setActiveMeeting(processedMeeting);

      setProcessing({
        step: 'completed',
        progressMessage: 'Informe completado con éxito',
      });

    } catch (err: unknown) {
      console.error('[Meetlingua Processing Error]', err);
      const message = err instanceof Error ? err.message : String(err);
      setProcessing({
        step: 'error',
        progressMessage: '',
        error: message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100">
      
      {/* Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={!!customApiKey}
        historyCount={history.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Processing Step Overlay Modal */}
        <ProcessingOverlay step={processing.step} message={processing.progressMessage} />

        {/* Error Alert Box */}
        {processing.step === 'error' && (
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Ocurrió un inconveniente al procesar</h4>
                <p className="text-xs text-rose-300 mt-1">{processing.error}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Configurar Key</span>
              </button>

              <button
                onClick={() => setProcessing({ step: 'idle', progressMessage: '' })}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        )}

        {/* If Active Meeting is present, display full Report View */}
        {activeMeeting ? (
          <ReportView
            meeting={activeMeeting}
            onReset={() => setActiveMeeting(null)}
          />
        ) : (
          /* Input & Capture Workflow Selection */
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* Hero Title Banner */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-accent-amber" />
                <span>Inteligencia Artificial Multilingüe de Alta Fidelidad</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Captura tus <span className="text-gradient">Reuniones y Clases</span> y obtén Informes en <span className="text-gradient-amber">Español</span>
              </h2>

              <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Graba o sube audios en alemán, español o cualquier idioma. Whisper transcribe el contenido técnico y GPT-4o extrae propuestas, decisiones y tareas estructuradas en español.
              </p>
            </div>

            {/* Language Selector */}
            <LanguageSelector
              selectedLanguage={audioLanguage}
              onSelectLanguage={saveAudioLanguage}
              disabled={processing.step !== 'idle' && processing.step !== 'completed' && processing.step !== 'error'}
            />

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center p-1 bg-gray-950/80 rounded-2xl border border-white/10 max-w-md mx-auto">
              <button
                onClick={() => setActiveTab('record')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-gradient-to-r from-brand-600 to-accent-violet text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Grabar Sesión Dual</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-brand-600 to-accent-violet text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Subir Audio (.mp3/.wav)</span>
              </button>
            </div>

            {/* Mode Content */}
            {activeTab === 'record' ? (
              <DualAudioRecorder
                onRecordingComplete={(blob, duration) => handleAudioSubmit(blob, duration)}
                disabled={processing.step !== 'idle' && processing.step !== 'error'}
              />
            ) : (
              <AudioDropzone
                onFileSelect={(file) => handleAudioSubmit(file, 0, file.name)}
                disabled={processing.step !== 'idle' && processing.step !== 'error'}
              />
            )}

            {/* Quick Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/5">
              <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                  Mezcla de Audio Dual
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Captura simultáneamente la voz del equipo (audio del sistema) y tu propia voz por micrófono en una única señal limpia.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-amber"></span>
                  Whisper STT Técnico
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Optimizado con contexto de arquitectura web, desarrollo frontend/backend y jerga de software para máxima precisión en alemán.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-1.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-emerald"></span>
                  Informe Estructurado GPT-4o
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Generación automática de Resumen Ejecutivo, Propuestas de Dirk/Interlocutores, Resoluciones, Action Items y Glosario.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-gray-500">
        <p>Meetlingua AI &copy; 2026 • Diseñado para captura multilingüe de reuniones en alemán y traducción técnica al español</p>
      </footer>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectMeeting={(meeting) => setActiveMeeting(meeting)}
        onDeleteMeeting={deleteMeetingFromHistory}
        onClearAll={clearHistory}
      />

      {/* API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveKey={saveCustomApiKey}
        currentKey={customApiKey}
      />

    </div>
  );
}
