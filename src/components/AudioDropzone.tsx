'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  X, 
  AlertCircle, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { validateAudioFile } from '@/lib/audioUtils';

interface AudioDropzoneProps {
  onFilesSelect: (files: File[]) => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
}

export const AudioDropzone: React.FC<AudioDropzoneProps> = ({
  onFilesSelect,
  onFileSelect,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const addFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const validNewFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const validation = validateAudioFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error || 'Formato no soportado'}`);
      } else {
        // Prevent duplicate files with identical name, size, and timestamp
        const isDuplicate = selectedFiles.some(
          (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
        );
        if (!isDuplicate) {
          validNewFiles.push(file);
        }
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join(' | '));
    }

    if (validNewFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validNewFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input value so re-selecting the same file works if needed
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index >= selectedFiles.length - 1) return;
    setSelectedFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;
    if (onFilesSelect) {
      onFilesSelect(selectedFiles);
    } else if (onFileSelect) {
      onFileSelect(selectedFiles[0]);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-brand-400" />
          <span>Cargar Grabaciones de la Sesión</span>
        </h3>

        {selectedFiles.length > 0 && (
          <span className="text-[11px] font-medium text-brand-300 bg-brand-500/10 border border-brand-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <Layers className="w-3.5 h-3.5" />
            <span>{selectedFiles.length} {selectedFiles.length === 1 ? 'audio listo' : 'audios para unificar'}</span>
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Sube uno o varios audios (.mp3, .m4a, .wav, .webm). Si tienes audios separados sobre el mismo tema, puedes agregarlos todos y ordenarlos para generar un único resumen integral.
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.m4a,.wav,.webm,.ogg,.aac,.mp4,.flac"
        onChange={handleFileChange}
        className="hidden"
      />

      {selectedFiles.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-brand-500/40 bg-gray-950/40 hover:bg-gray-900/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">
              Arrastra y suelta uno o varios audios aquí, o <span className="text-brand-400 underline">examina tus carpetas</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Soporta MP3, M4A, WAV, WEBM • Puedes seleccionar múltiples archivos a la vez
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Files List Card */}
          <div className="p-4 rounded-xl bg-gray-950/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
              <span className="text-gray-400 font-medium">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo cargado' : 'archivos en cola'} • {(totalBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  title="Seleccionar más archivos"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-400" />
                  <span>Añadir más</span>
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={disabled}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  title="Vaciar lista de audios"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              </div>
            </div>

            {/* Droppable miniature area if user wants to drop more */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`space-y-2 max-h-60 overflow-y-auto pr-1 ${isDragging ? 'ring-2 ring-brand-400 rounded-lg p-1 bg-brand-500/5' : ''}`}
            >
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-900/90 border border-white/5 hover:border-brand-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-md bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                      <FileAudio className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  {/* Actions: Reorder and Remove */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveUp(idx)}
                      disabled={disabled || idx === 0}
                      className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      title="Mover arriba en el orden cronológico"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(idx)}
                      disabled={disabled || idx === selectedFiles.length - 1}
                      className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      title="Mover abajo en el orden cronológico"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      disabled={disabled}
                      className="p-1 rounded bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all ml-1"
                      title="Quitar este archivo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reorder explanation */}
            {selectedFiles.length > 1 && (
              <p className="text-[11px] text-gray-400 pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0"></span>
                <span>
                  Los audios se procesarán en este orden secuencial (#1, #2...). Usa las flechas para ordenar cronológicamente.
                </span>
              </p>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent-amber" />
              <span>
                {selectedFiles.length === 1 
                  ? 'Se transcribirá y resumirá este audio.' 
                  : `Se transcribirán los ${selectedFiles.length} audios y se generará 1 único informe unificado.`}
              </span>
            </span>

            <button
              onClick={handleSubmit}
              disabled={disabled}
              className="glow-button w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <span>
                {selectedFiles.length === 1 ? 'Procesar Audio' : `Procesar ${selectedFiles.length} Audios Juntos`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
