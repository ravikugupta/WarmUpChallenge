import { GoogleGenAI } from "@google/genai";
import { getRuntimeConfig } from "../lib/config";

const getGeminiClient = () => {
  const config = getRuntimeConfig();
  const apiKey = config.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Nexus Intelligence API key is not set. Please configure VITE_GEMINI_API_KEY in your .env file.');
  }
  
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeSituation = async (input: string, retryCount = 0): Promise<any> => {
  const ai = getGeminiClient();
  const MAX_RETRIES = 3;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [{ text: input }] }],
      config: {
        systemInstruction: `You are Nexus Intelligence, a universal bridge between human intent and complex systems. 
      Your goal is to take messy, unstructured real-world inputs and convert them into structured, verified, and life-saving actions.`,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            situation: { type: "string" },
            confidence: { type: "number" },
            priority: { type: "string", enum: ["High", "Medium", "Low"] },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  title: { type: "string" },
                  status: { type: "string", enum: ["RECOMMENDED", "READY", "PENDING"] },
                  description: { type: "string" },
                  instructions: { type: "array", items: { type: "string" } },
                  actionText: { type: "string" },
                  icon: { type: "string", enum: ["call", "info", "check", "alert"] }
                },
                required: ["id", "title", "status", "description", "instructions", "actionText", "icon"]
              }
            },
            impactProjection: { type: "string" }
          },
          required: ["situation", "confidence", "priority", "actions", "impactProjection"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Nexus Intelligence");
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
