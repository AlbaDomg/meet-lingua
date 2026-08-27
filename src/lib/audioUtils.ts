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

  const maxSizeMB = 100;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `El archivo supera el límite de ${maxSizeMB}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Por favor usa un archivo de menos de 100MB.`,
    };
  }

  return { valid: true };
}
