'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, X, AlertCircle, ArrowRight } from 'lucide-react';
import { validateAudioFile } from '@/lib/audioUtils';

interface AudioDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const AudioDropzone: React.FC<AudioDropzoneProps> = ({
  onFileSelect,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const processFile = (file: File) => {
    setErrorMessage(null);
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Archivo de audio no válido.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitFile = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all">
      <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-brand-400" />
        <span>Cargar Grabación Preexistente</span>
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Sube archivos .mp3, .m4a, .wav o .webm de reuniones previas en alemán (máx. 25MB).
      </p>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.m4a,.wav,.webm,.ogg,.aac"
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
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
              Arrastra y suelta tu archivo de audio aquí, o <span className="text-brand-400 underline">examina tus carpetas</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Soporta MP3, M4A, WAV, WEBM (Hasta 25 MB por reunión)
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gray-900/80 border border-brand-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Audio listo para Whisper
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearFile}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
              title="Cambiar archivo"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              onClick={submitFile}
              disabled={disabled}
              className="glow-button px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Procesar Reunión</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
