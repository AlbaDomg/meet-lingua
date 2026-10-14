export interface ActionItem {
  id: string;
  tarea: string;
  responsable: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaLimite?: string;
}

export interface IdeaPropuesta {
  id: string;
  titulo: string;
  descripcion: string;
  detallesTecnicos?: string;
  interlocutor?: string;
}

export interface TerminoGlosario {
  termino: string;
  definicion: string;
  categoria?: string;
}

export interface MeetingReportData {
  tituloReunion: string;
  fecha: string;
  duracionEstimada?: string;
  resumenEjecutivo: string;
  ideasYPropuestas: IdeaPropuesta[];
  acuerdosYDecisiones: string[];
  actionItems: ActionItem[];
  glosario: TerminoGlosario[];
  markdownCompleto: string;
}

export type AudioLanguage = 'de' | 'es' | 'auto';

export interface ProcessedMeeting {
  id: string;
  fechaCreacion: string;
  nombreArchivo?: string;
  archivos?: string[];
  modoCaptura: 'grabacion' | 'subida';
  transcripcionAleman: string;
  transcripcionOriginal?: string;
  idiomaAudio?: AudioLanguage;
  informeEspanol: MeetingReportData;
  duracionSegundos: number;
}

export type ProcessingStep = 
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'error';

export interface ProcessingState {
  step: ProcessingStep;
  progressMessage: string;
  error?: string;
}
