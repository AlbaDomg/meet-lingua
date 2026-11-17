/**
 * Audio Utility Helper for Meetlingua AI
 * Combines system screen audio and microphone input into a single Web Audio stream.
 */

export interface DualStreamResult {
  combinedStream: MediaStream;
  audioContext: AudioContext;
  micStream?: MediaStream;
  displayStream?: MediaStream;
}

export async function createDualAudioStream(): Promise<DualStreamResult> {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const destinationNode = audioContext.createMediaStreamDestination();

  let micStream: MediaStream | undefined;
  let displayStream: MediaStream | undefined;

  try {
    // 1. Capture user microphone
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const micSource = audioContext.createMediaStreamSource(micStream);
    const micGain = audioContext.createGain();
    micGain.gain.value = 1.0;
    micSource.connect(micGain);
    micGain.connect(destinationNode);
  } catch (err) {
    console.warn("No se pudo obtener acceso al micrófono:", err);
    throw new Error("MIC_DENIED: Se requiere permiso de micrófono para grabar la reunión.");
  }

  // 2. Capture system/display audio (e.g., Zoom call sound or browser tab)
  try {
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // getDisplayMedia requires video: true in standard web APIs to get audio track
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const displayAudioStream = new MediaStream([audioTracks[0]]);
      const displaySource = audioContext.createMediaStreamSource(displayAudioStream);
      const displayGain = audioContext.createGain();
      displayGain.gain.value = 1.2; // Slightly boost interlocutor volume
      displaySource.connect(displayGain);
      displayGain.connect(destinationNode);
    } else {
      console.info("El usuario compartió pantalla sin activar la opción de Compartir Audio del sistema.");
    }
  } catch (err) {
    console.info("El usuario omitió la captura de audio del sistema o la pantalla.", err);
    // User cancelled display share, but mic is still active
  }

  return {
    combinedStream: destinationNode.stream,
    audioContext,
    micStream,
    displayStream,
  };
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = [".mp3", ".m4a", ".wav", ".webm", ".ogg", ".aac", ".mp4", ".flac"];
  const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

  if (!allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Formato de archivo no soportado (${fileExt}). Por favor usa .mp3, .m4a, .wav o .webm.`,
    };
  }

  const maxSizeMB = 250;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `El archivo supera el límite de ${maxSizeMB}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Por favor usa un archivo de menos de ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM = 1
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Splits an audio file or recording Blob into valid, playable WAV chunks.
 * Downsamples and mixes down to 16kHz mono (Whisper's native format) so each
 * chunk is lightweight, strictly conforms to serverless payload limits (<3.5MB),
 * and prevents any audio header corruption.
 */
export async function splitAudioFileIntoWavChunks(
  file: File | Blob,
  fileName: string = 'audio.wav',
  chunkDurationSec: number = 90,
  onProgress?: (msg: string) => void
): Promise<File[]> {
  // If file is already small (<= 3.5MB), return as is without extra decoding
  if (file.size <= 3.5 * 1024 * 1024) {
    if (file instanceof File) {
      return [file];
    }
    return [new File([file], fileName, { type: file.type || 'audio/webm' })];
  }

  onProgress?.(`Decodificando audio (${(file.size / (1024 * 1024)).toFixed(1)} MB) para división inteligente...`);

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Tu navegador no soporta Web Audio API para procesar archivos de audio grandes.');
  }

  const audioContext = new AudioCtx();
  let decodedBuffer: AudioBuffer;

  try {
    const arrayBuffer = await file.arrayBuffer();
    decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } catch (err) {
    console.error('Error al decodificar audio con Web Audio API:', err);
    throw new Error(
      `No se pudo decodificar el archivo "${fileName}". Asegúrate de que el formato sea reproducible o conviértelo a MP3/WAV estándar.`
    );
  } finally {
    await audioContext.close().catch(() => {});
  }

  const totalDuration = decodedBuffer.duration;
  const targetSampleRate = 16000; // Native Whisper STT sampling rate
  const totalChunks = Math.ceil(totalDuration / chunkDurationSec);

  const resultFiles: File[] = [];
  const baseName = fileName.replace(/\.[^/.]+$/, '');

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const startTime = chunkIdx * chunkDurationSec;
    const duration = Math.min(chunkDurationSec, totalDuration - startTime);
    if (duration <= 0) break;

    onProgress?.(`Preparando fragmento de alta fidelidad (${chunkIdx + 1} de ${totalChunks})...`);

    const sampleCount = Math.max(1, Math.ceil(duration * targetSampleRate));
    const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtx(1, sampleCount, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, startTime, duration);

    const renderedChunk = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWavBlob(renderedChunk);

    const chunkFileName = `${baseName}_part${chunkIdx + 1}.wav`;
    resultFiles.push(new File([wavBlob], chunkFileName, { type: 'audio/wav' }));
  }

  return resultFiles;
}
