'use client';

import React, { useState } from 'react';
import { X, Search, Trash2, Calendar, Clock, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { ProcessedMeeting } from '@/lib/types';
import { formatTime } from '@/lib/audioUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ProcessedMeeting[];
  onSelectMeeting: (meeting: ProcessedMeeting) => void;
  onDeleteMeeting: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectMeeting,
  onDeleteMeeting,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const title = item.informeEspanol?.tituloReunion || '';
    const date = item.fechaCreacion || '';
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      date.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-gray-950 border-l border-white/10 h-full flex flex-col shadow-2xl p-6 relative animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-bold text-white">Historial de Reuniones</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="my-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en el historial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Meeting Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 rounded-xl glass-panel glass-panel-hover border border-white/5 flex items-center justify-between gap-3 group transition-all cursor-pointer"
                onClick={() => {
                  onSelectMeeting(meeting);
                  onClose();
                }}
              >
                <div className="flex-1 truncate">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">
                    {meeting.informeEspanol?.tituloReunion || 'Reunión sin título'}
                  </h4>
                  
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {meeting.fechaCreacion}
                    </span>
                    {meeting.duracionSegundos > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {formatTime(meeting.duracionSegundos)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMeeting(meeting.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-80 group-hover:opacity-100"
                    title="Eliminar del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-gray-600" />
              <span>No se encontraron reuniones guardadas.</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">{history.length} informe(s) en memoria</span>
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Historial</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
