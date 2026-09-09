import { NextRequest, NextResponse } from 'next/server';
import { createOpenAIClient } from '@/lib/openai';
import { GPT4O_SYSTEM_PROMPT, getWhisperPrompt, getGPT4oUserPrompt } from '@/lib/prompts';
import { MeetingReportData } from '@/lib/types';

export const maxDuration = 300; // 5 minutes timeout limit for long audio files

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const customApiKey = req.headers.get('x-openai-key') || (formData.get('customApiKey') as string | null) || undefined;
    const audioLanguage = (formData.get('audioLanguage') as string | null) || 'de';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se ha adjuntado ningún archivo de audio para procesar.' },
        { status: 400 }
      );
    }

    // Initialize OpenAI SDK
    let openai;
    try {
      openai = createOpenAIClient(customApiKey);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { 
          error: 'OPENAI_KEY_MISSING',
          message: errorMessage || 'Falta la clave API de OpenAI. Configura OPENAI_API_KEY en .env.local o insértala en los ajustes.',
        },
        { status: 401 }
      );
    }

    console.log(`[Meetlingua AI] Procesando audio (${audioLanguage}): ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // Step 1: Transcribe audio with OpenAI Whisper (whisper-1)
    let transcriptText = '';
    const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB safe chunk limit

    const whisperPrompt = getWhisperPrompt(audioLanguage);

    if (audioFile.size > 24 * 1024 * 1024) {
      const chunksCount = Math.ceil(audioFile.size / MAX_CHUNK_SIZE);
      console.log(`[Meetlingua AI] Archivo grande de audio (${(audioFile.size / 1024 / 1024).toFixed(2)} MB). Dividiendo en ${chunksCount} partes...`);
      for (let i = 0; i < chunksCount; i++) {
        const start = i * MAX_CHUNK_SIZE;
        const end = Math.min(audioFile.size, start + MAX_CHUNK_SIZE);
        const chunkBlob = audioFile.slice(start, end, audioFile.type || 'audio/webm');
        const chunkFile = new File([chunkBlob], `part_${i + 1}_${audioFile.name}`, { type: audioFile.type || 'audio/webm' });

        const whisperOptions: {
          file: File;
          model: string;
          prompt: string;
          temperature: number;
          language?: string;
        } = {
          file: chunkFile,
          model: 'whisper-1',
          prompt: whisperPrompt,
          temperature: 0.0,
        };
        if (audioLanguage !== 'auto') whisperOptions.language = audioLanguage;

        const partTranscription = await openai.audio.transcriptions.create(whisperOptions);

        if (partTranscription.text) {
          transcriptText += (transcriptText ? ' ' : '') + partTranscription.text;
        }
      }
    } else {
      const whisperOptions: {
        file: File;
        model: string;
        prompt: string;
        temperature: number;
        language?: string;
      } = {
        file: audioFile,
        model: 'whisper-1',
        prompt: whisperPrompt,
        temperature: 0.0,
      };
      if (audioLanguage !== 'auto') whisperOptions.language = audioLanguage;

      const transcription = await openai.audio.transcriptions.create(whisperOptions);
      transcriptText = transcription.text;
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Whisper no pudo extraer audio audible o la grabación estaba en silencio.' },
        { status: 422 }
      );
    }

    console.log(`[Meetlingua AI] Transcripción completada (${transcriptText.length} caracteres). Generando informe en español con GPT-4o...`);

    // Step 2: Analyze transcript with gpt-4o and generate structured Spanish JSON
    const userPrompt = getGPT4oUserPrompt(audioLanguage, transcriptText);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GPT4O_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: userPrompt 
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT-4o devolvió una respuesta vacía al estructurar el informe.');
    }

    const parsedReport: MeetingReportData = JSON.parse(content);

    // Fallback: If markdownCompleto is missing, construct it dynamically
    if (!parsedReport.markdownCompleto) {
      parsedReport.markdownCompleto = generateMarkdownFallback(parsedReport);
    }

    return NextResponse.json({
      success: true,
      transcripcionAleman: transcriptText,
      transcripcionOriginal: transcriptText,
      idiomaAudio: audioLanguage,
      informeEspanol: parsedReport,
    });

  } catch (error: unknown) {
    console.error('[Meetlingua AI Error]', error);
    const errObj = error as { message?: string; status?: number; code?: string; type?: string };
    
    if (errObj.code === 'insufficient_quota' || errObj.status === 429 || (errObj.message && errObj.message.includes('quota'))) {
      return NextResponse.json(
        { 
          error: 'INSUFFICIENT_QUOTA', 
          message: 'Tu cuenta de OpenAI se ha quedado sin saldo/créditos (429 Insufficient Quota). Por favor recarga créditos en https://platform.openai.com/settings/organization/billing o ingresa otra API Key.' 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'PROCESSING_FAILED', 
        message: errObj.message || 'Ocurrió un error inesperado al procesar la reunión con OpenAI.' 
      },
      { status: errObj.status || 500 }
    );
  }
}

function generateMarkdownFallback(report: MeetingReportData): string {
  let md = `# ${report.tituloReunion || 'Informe de Reunión'}\n\n`;
  md += `**Fecha:** ${report.fecha || new Date().toLocaleDateString('es-ES')}\n\n`;
  md += `## Resumen Ejecutivo\n${report.resumenEjecutivo}\n\n`;
  
  if (report.ideasYPropuestas?.length) {
    md += `## Ideas y Propuestas del Interlocutor\n`;
    report.ideasYPropuestas.forEach((item) => {
      md += `### ${item.titulo}\n`;
      if (item.interlocutor) md += `*Propuesto por: ${item.interlocutor}*\n\n`;
      md += `${item.descripcion}\n\n`;
      if (item.detallesTecnicos) md += `**Detalles Técnicos:** ${item.detallesTecnicos}\n\n`;
    });
  }

  if (report.acuerdosYDecisiones?.length) {
    md += `## Acuerdos y Decisiones\n`;
    report.acuerdosYDecisiones.forEach((acuerdo) => {
      md += `- ${acuerdo}\n`;
    });
    md += `\n`;
  }

  if (report.actionItems?.length) {
    md += `## Action Items & Próximos Pasos\n`;
    report.actionItems.forEach((action) => {
      md += `- [ ] **${action.tarea}** (Responsable: ${action.responsable} | Prioridad: ${action.prioridad})\n`;
    });
    md += `\n`;
  }

  if (report.glosario?.length) {
    md += `## Glosario / Términos Técnicos\n`;
    report.glosario.forEach((term) => {
      md += `- **${term.termino}**: ${term.definicion}\n`;
    });
  }

  return md;
}
