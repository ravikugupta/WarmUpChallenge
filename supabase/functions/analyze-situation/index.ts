import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai@0.1.1";
import { corsHeaders } from "../_shared/cors.ts";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") || "" });

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();

    if (!input) {
      return new Response(JSON.stringify({ error: "Input is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: input }] }],
      config: {
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
        }`,
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
                  icon: { type: Type.STRING },
                },
              },
            },
            impactProjection: { type: Type.STRING },
          },
        },
      },
    });

    return new Response(response.text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
