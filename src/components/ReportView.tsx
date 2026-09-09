'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Languages, 
  Search, 
  CheckCircle2, 
  ListTodo, 
  BookOpen, 
  Lightbulb, 
  Download, 
  Copy, 
  Check, 
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock
} from 'lucide-react';
import { ProcessedMeeting } from '@/lib/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatTime } from '@/lib/audioUtils';

interface ReportViewProps {
  meeting: ProcessedMeeting;
  onReset: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ meeting, onReset }) => {
  const [activeTab, setActiveTab] = useState<'informe' | 'transcripcion'>('informe');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedGerman, setCopiedGerman] = useState(false);

  const { informeEspanol, transcripcionAleman, duracionSegundos } = meeting;

  // Highlight German search query matches
  const highlightSearch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-[\]{}()*+?.:\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-amber-400/30 text-amber-200 px-1 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const copyGermanTranscript = () => {
    navigator.clipboard.writeText(transcripcionAleman);
    setCopiedGerman(true);
    setTimeout(() => setCopiedGerman(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] font-semibold border border-brand-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-400" />
                Informe Generado con éxito
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {meeting.fechaCreacion}
              </span>
              {duracionSegundos > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(duracionSegundos)}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              {informeEspanol.tituloReunion || 'Informe de Reunión Multilingüe'}
            </h2>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4 text-brand-400" />
            <span>Nueva Grabación</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 border-b border-white/10 pb-0.5">
          <button
            onClick={() => setActiveTab('informe')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'informe'
                ? 'border-brand-500 text-brand-300 bg-brand-500/10 rounded-t-xl'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Informe en Español</span>
          </button>

          <button
            onClick={() => setActiveTab('transcripcion')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'transcripcion'
                ? 'border-brand-500 text-brand-300 bg-brand-500/10 rounded-t-xl'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>
              Transcripción Original {meeting.idiomaAudio === 'es' ? '(Español 🇪🇸)' : meeting.idiomaAudio === 'de' ? '(Alemán 🇩🇪)' : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Informe en Español */}
      {activeTab === 'informe' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Resumen Ejecutivo</span>
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {informeEspanol.resumenEjecutivo}
            </p>
          </div>

          {/* Grid Layout for Ideas & Decisions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ideas & Proposals */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span>Ideas y Propuestas del Interlocutor</span>
              </h3>

              <div className="space-y-4 flex-1">
                {informeEspanol.ideasYPropuestas?.length ? (
                  informeEspanol.ideasYPropuestas.map((idea, idx) => (
                    <div key={idea.id || idx} className="p-4 rounded-xl bg-gray-900/60 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">{idea.titulo}</h4>
                        {idea.interlocutor && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                            {idea.interlocutor}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{idea.descripcion}</p>
                      {idea.detallesTecnicos && (
                        <div className="text-[11px] text-brand-300 bg-brand-500/10 p-2 rounded-lg border border-brand-500/20">
                          <span className="font-semibold">Detalle Técnico:</span> {idea.detallesTecnicos}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No se registraron propuestas específicas.</p>
                )}
              </div>
            </div>

            {/* Decisions & Resolutions */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Acuerdos y Decisiones Pactadas</span>
              </h3>

              <div className="space-y-3 flex-1">
                {informeEspanol.acuerdosYDecisiones?.length ? (
                  informeEspanol.acuerdosYDecisiones.map((acuerdo, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                      <p className="text-xs text-emerald-200 font-medium leading-relaxed">{acuerdo}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No se registraron decisiones formales en la sesión.</p>
                )}
              </div>
            </div>

          </div>

          {/* Action Items Section */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-accent-violet" />
              <span>Action Items & Próximos Pasos</span>
            </h3>

            {informeEspanol.actionItems?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {informeEspanol.actionItems.map((action, idx) => (
                  <div key={action.id || idx} className="p-4 rounded-xl bg-gray-900/60 border border-white/5 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white leading-snug">{action.tarea}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        action.prioridad === 'Alta'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : action.prioridad === 'Media'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {action.prioridad}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-2">
                      <span>Responsable: <strong className="text-gray-200">{action.responsable || 'Por asignar'}</strong></span>
                      {action.fechaLimite && <span>Plazo: <strong>{action.fechaLimite}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No hay action items pendientes.</p>
            )}
          </div>

          {/* Technical Glossary */}
          {informeEspanol.glosario?.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Glosario & Términos Técnicos</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {informeEspanol.glosario.map((term, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-gray-900/60 border border-white/5 space-y-1">
                    <span className="text-xs font-bold text-cyan-300 block">{term.termino}</span>
                    <p className="text-xs text-gray-300">{term.definicion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Markdown Document Drawer/Renderer */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <MarkdownRenderer 
              content={informeEspanol.markdownCompleto} 
              title={informeEspanol.tituloReunion} 
            />
          </div>
        </div>
      )}

      {/* Tab 2: Transcripción Original en Alemán */}
      {activeTab === 'transcripcion' && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Languages className="w-5 h-5 text-brand-400" />
                <span>
                  Transcripción Whisper {meeting.idiomaAudio === 'es' ? '(Español 🇪🇸)' : meeting.idiomaAudio === 'de' ? '(Alemán 🇩🇪)' : 'Original'}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                {(meeting.transcripcionOriginal || transcripcionAleman).split(/\s+/).length} palabras transcribidas con modelo whisper-1.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar texto en la transcripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 w-48 sm:w-64"
                />
              </div>

              {/* Copy button */}
              <button
                onClick={copyGermanTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-white/10 transition-all cursor-pointer"
              >
                {copiedGerman ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transcript Text Container */}
          <div className="p-4 rounded-xl bg-gray-950/80 border border-white/5 font-mono text-xs text-gray-300 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap selection:bg-brand-500/40">
            {highlightSearch(transcripcionAleman, searchQuery)}
          </div>
        </div>
      )}
    </div>
  );
};
