import OpenAI from 'openai';

export function createOpenAIClient(customApiKey?: string): OpenAI {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "MISSING_API_KEY: No se configuró OPENAI_API_KEY en .env ni se proporcionó una clave personalizada."
    );
  }

  return new OpenAI({
    apiKey: apiKey,
  });
}
