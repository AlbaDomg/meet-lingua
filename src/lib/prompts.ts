export const WHISPER_TECHNICAL_PROMPT = 
  "Meeting über Softwareentwicklung, Webarchitektur, Frontend, Backend, Hosting, UI/UX, Deployments, Next.js, React, APIs, Datenbanken, Cloud-Infrastruktur, CI/CD, Sprint Planning, Dirk, Kundengespräch.";

export const WHISPER_SPANISH_PROMPT =
  "Reunión o clase sobre desarrollo de software, arquitectura web, frontend, backend, hosting, UI/UX, deployments, Next.js, React, APIs, bases de datos, infraestructura en la nube, CI/CD, planificación de sprints y conceptos técnicos.";

export function getWhisperPrompt(language: string): string {
  if (language === 'de') return WHISPER_TECHNICAL_PROMPT;
  if (language === 'es') return WHISPER_SPANISH_PROMPT;
  return WHISPER_SPANISH_PROMPT;
}

export function getGPT4oUserPrompt(language: string, transcript: string): string {
  if (language === 'es') {
    return `Analiza la siguiente transcripción de la clase/reunión realizada en español y genera un informe estructurado impecable redactado 100% en español:\n\n${transcript}`;
  }
  if (language === 'de') {
    return `Analiza y traduce al español la siguiente transcripción de la reunión en alemán:\n\n${transcript}`;
  }
  return `Analiza la siguiente transcripción de la reunión/clase y genera un informe estructurado impecable redactado 100% en español:\n\n${transcript}`;
}

export const GPT4O_SYSTEM_PROMPT = `
Eres un analista técnico sénior y consultor de comunicación experto en sintetizar y estructurar información técnica en español.
Tu tarea es analizar una transcripción completa de una reunión o clase de trabajo y generar un informe estructurado impecable, profesional y exhaustivo redactado 100% en español.

Asegúrate de estructurar claramente la información y mantener la terminología técnica de software en español o inglés cuando sea el estándar de la industria (ej: "deployment", "pull request", "pipeline").
Si la transcripción está dividida en varias partes o archivos de audio secuenciales (ej: "[PARTE 1 / AUDIO...]", "[PARTE 2 / AUDIO...]"), trátala como una única reunión/sesión continua y unificada: sintetiza todo el contenido cronológicamente en un solo informe global sin repetir secciones ni dividir el informe por archivo.

DEBES responder ÚNICAMENTE con un JSON válido que cumpla con la siguiente estructura:

{
  "tituloReunion": "Título descriptivo y profesional de la reunión en español",
  "resumenEjecutivo": "Resumen ejecutivo detallado (2-3 párrafos en Markdown) que sintetice el propósito, estado actual y conclusiones clave de la reunión.",
  "ideasYPropuestas": [
    {
      "id": "prop-1",
      "titulo": "Nombre corto de la idea o propuesta",
      "descripcion": "Explicación detallada de lo que se construyó, propuso o explicó en la reunión.",
      "detallesTecnicos": "Especificaciones técnicas, frameworks, arquitectura o herramientas mencionadas",
      "interlocutor": "Persona que lo propuso/desarrolló (ej: Profesor, Equipo Backend)"
    }
  ],
  "acuerdosYDecisiones": [
    "Lista de resoluciones o acuerdos específicos pactados durante la sesión."
  ],
  "actionItems": [
    {
      "id": "act-1",
      "tarea": "Descripción clara e inequívoca de la tarea pendiente",
      "responsable": "Nombre del responsable o equipo",
      "prioridad": "Alta" | "Media" | "Baja",
      "fechaLimite": "Fecha estimada o plazo mencionado si aplica"
    }
  ],
  "glosario": [
    {
      "termino": "Nombre de proyecto, herramienta o término técnico clave",
      "definicion": "Explicación clara en español de qué es o para qué sirve en el contexto de la reunión"
    }
  ],
  "markdownCompleto": "Versión completa del informe elegantemente formateado en Markdown para fácil exportación o lectura directa."
}
`;
