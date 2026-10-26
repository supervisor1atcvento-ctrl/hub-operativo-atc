import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }

  return aiClient;
}

export async function generateRAGAnswer(
  systemInstruction: string,
  userPrompt: string,
  timeoutMs = 3500
): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) {
    return null;
  }

  try {
    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Low temperature for high precision and zero hallucination
        topP: 0.95
      }
    }).then((res) => res.text || null).catch((err) => {
      console.warn('Gemini generateContent call failed:', err.message || err);
      return null;
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });

    const result = await Promise.race([callPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn('Error calling Gemini model in generateRAGAnswer:', err);
    return null;
  }
}
