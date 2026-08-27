import { NextRequest, NextResponse } from 'next/server';
import { createOpenAIClient } from '@/lib/openai';
import { WHISPER_TECHNICAL_PROMPT } from '@/lib/prompts';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const customApiKey = req.headers.get('x-openai-key') || (formData.get('customApiKey') as string | null) || undefined;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se ha adjuntado ningún fragmento de audio.' },
        { status: 400 }
      );
    }

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

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'de',
      prompt: WHISPER_TECHNICAL_PROMPT,
      temperature: 0.0,
    });

    return NextResponse.json({
      success: true,
      text: transcription.text || '',
    });

  } catch (error: unknown) {
    console.error('[Meetlingua Transcribe Error]', error);
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
        error: 'TRANSCRIBE_FAILED', 
        message: errObj.message || 'Error al transcribir el fragmento de audio con Whisper.' 
      },
      { status: errObj.status || 500 }
    );
  }
}
