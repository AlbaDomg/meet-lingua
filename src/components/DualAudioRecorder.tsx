'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Monitor, Square, Play, Pause, AlertTriangle, Radio, Volume2 } from 'lucide-react';
import { createDualAudioStream, formatTime, DualStreamResult } from '@/lib/audioUtils';

interface DualAudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  disabled?: boolean;
}

export const DualAudioRecorder: React.FC<DualAudioRecorderProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasSystemAudio, setHasSystemAudio] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dualStreamRef = useRef<DualStreamResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop all active tracks and reset context
  const cleanupStreams = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (dualStreamRef.current) {
      const { micStream, displayStream, audioContext } = dualStreamRef.current;
      micStream?.getTracks().forEach((track) => track.stop());
      displayStream?.getTracks().forEach((track) => track.stop());
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
      dualStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, [cleanupStreams]);

  // Canvas wave visualizer setup
  const setupVisualizer = (audioContext: AudioContext, stream: MediaStream) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(0.5, '#818cf8');
        gradient.addColorStop(1, '#10b981');

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setDuration(0);

    try {
      const dualResult = await createDualAudioStream();
      dualStreamRef.current = dualResult;

      const { combinedStream, audioContext, displayStream } = dualResult;

      // Check if user included display audio track
      const sysAudioTracks = displayStream?.getAudioTracks() || [];
      setHasSystemAudio(sysAudioTracks.length > 0);

      // Select mimeType supported by browser
      let mimeType = 'audio/webm;codecs=opus';
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType };
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMime = mediaRecorder.mimeType || 'audio/webm';
        const recordedBlob = new Blob(audioChunksRef.current, { type: finalMime });
        onRecordingComplete(recordedBlob, duration);
        cleanupStreams();
      };

      // Start MediaRecorder with timeslice of 1 second
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      // Start Audio Visualizer
      setupVisualizer(audioContext, combinedStream);

      // Start timer interval
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err: unknown) {
      console.error("Error al iniciar grabación:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('MIC_DENIED')) {
        setErrorMessage("Permiso denegado: Por favor habilita el uso del micrófono para iniciar la grabación.");
      } else {
        setErrorMessage("No se pudo iniciar la captura de audio dual. Verifica los permisos de tu navegador.");
      }
      cleanupStreams();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all">
      {/* Top Banner Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isRecording ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Grabación en Vivo de Reunión</h3>
            <p className="text-xs text-gray-400">Captura audio del sistema (Zoom/Meet/Teams) + tu Micrófono</p>
          </div>
        </div>

        {/* Timer display */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900/90 border border-red-500/30 text-red-400 font-mono font-bold text-sm shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            {formatTime(duration)}
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* System audio track detection status banner */}
      {isRecording && hasSystemAudio !== null && (
        <div className={`mb-4 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
          hasSystemAudio 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            <span>
              {hasSystemAudio
                ? 'Audio del sistema capturado activamente (Zoom/Pantalla + Micrófono)'
                : 'Grabando solo Micrófono (Para capturar interlocutores, comparte pantalla con "Audio del sistema")'}
            </span>
          </div>
        </div>
      )}

      {/* Visualizer Canvas & Waveform Area */}
      <div className="relative w-full h-24 bg-gray-950/80 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center mb-6">
        {isRecording ? (
          <canvas
            ref={canvasRef}
            width={400}
            height={85}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500 text-xs">
            <Volume2 className="w-6 h-6 text-gray-600 opacity-60" />
            <span>Haz clic en "Iniciar Grabación" para mezclar Micrófono y Pantalla</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="glow-button px-6 py-3 rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Iniciar Grabación Dual</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Reanudar</span>
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>
            )}

            <button
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 border border-red-400/40 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Finalizar y Transcribir</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
