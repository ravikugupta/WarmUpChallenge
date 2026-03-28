import { GoogleGenAI, Type } from "@google/genai";
import { getRuntimeConfig } from "../lib/config";

const getGeminiClient = () => {
  const config = getRuntimeConfig();
  const apiKey = config.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Nexus Intelligence API key is not set. Please configure the required environment variable.');
  }
  
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeSituation = async (input: string, retryCount = 0): Promise<any> => {
  const ai = getGeminiClient();
  const MAX_RETRIES = 3;
  
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: `You are Nexus Intelligence, a universal bridge between human intent and complex systems. 
      Your goal is to take messy, unstructured real-world inputs and convert them into structured, verified, and life-saving actions.
      
      Output your analysis in the following JSON format:
      {
        "situation": "A concise summary of the situation",
        "confidence": number (0-100),
        "priority": "High" | "Medium" | "Low",
        "actions": [
          {
            "id": number,
            "title": "Action title",
            "status": "RECOMMENDED" | "READY" | "PENDING",
            "description": "Short description",
            "instructions": ["Step 1", "Step 2"],
            "actionText": "Button text",
            "icon": "call" | "info" | "check"
          }
        ],
        "impactProjection": "A short projection of the impact of these actions"
      }`
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: input }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situation: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            priority: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  status: { type: Type.STRING },
                  description: { type: Type.STRING },
                  instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  actionText: { type: Type.STRING },
                  icon: { type: Type.STRING }
                }
              }
            },
            impactProjection: { type: Type.STRING }
          }
        }
      }
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.warn(`Nexus Intelligence attempt ${retryCount + 1} failed:`, error.message);
    
    // Check for 503 or "high demand" errors
    const isRetryable = error.message?.includes('503') || 
                      error.message?.includes('high demand') ||
                      error.message?.includes('overloaded');

    if (isRetryable && retryCount < MAX_RETRIES) {
      const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      console.log(`Retrying in ${Math.round(waitTime)}ms...`);
      await delay(waitTime);
      return analyzeSituation(input, retryCount + 1);
    }
    
    throw error;
  }
};