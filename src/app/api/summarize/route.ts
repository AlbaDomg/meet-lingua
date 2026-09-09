import { NextRequest, NextResponse } from 'next/server';
import { createOpenAIClient } from '@/lib/openai';
import { GPT4O_SYSTEM_PROMPT, getGPT4oUserPrompt } from '@/lib/prompts';
import { MeetingReportData } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { germanTranscriptText, transcriptText, audioLanguage = 'de', customApiKey } = body;
    const textToAnalyze = transcriptText || germanTranscriptText;
    const headerKey = req.headers.get('x-openai-key') || customApiKey || undefined;

    if (!textToAnalyze || typeof textToAnalyze !== 'string' || textToAnalyze.trim().length === 0) {
      return NextResponse.json(
        { error: 'No se recibió ninguna transcripción para analizar.' },
        { status: 400 }
      );
    }

    let openai;
    try {
      openai = createOpenAIClient(headerKey);
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

    const userPrompt = getGPT4oUserPrompt(audioLanguage, textToAnalyze);

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

    if (!parsedReport.markdownCompleto) {
      parsedReport.markdownCompleto = generateMarkdownFallback(parsedReport);
    }

    return NextResponse.json({
      success: true,
      informeEspanol: parsedReport,
    });

  } catch (error: unknown) {
    console.error('[Meetlingua Summarize Error]', error);
    const errObj = error as { message?: string; status?: number; code?: string };

    if (errObj.code === 'insufficient_quota' || errObj.status === 429 || (errObj.message && errObj.message.includes('quota'))) {
      return NextResponse.json(
        { 
          error: 'INSUFFICIENT_QUOTA', 
          message: 'Tu cuenta de OpenAI se ha quedado sin saldo/créditos (429 Insufficient Quota).' 
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'SUMMARIZE_FAILED', 
        message: errObj.message || 'Error al analizar la transcripción con GPT-4o.' 
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
