
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getAIResponse = async (userPrompt: string) => {
  if (!API_KEY) return "Lo siento, la clave de API no está configurada.";
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: "Eres un asistente de soporte técnico para la app 'Arreglados', un marketplace de servicios para el hogar en Argentina. Responde de forma amable, servicial y utiliza modismos argentinos (che, vos, etc) de manera profesional. Ayuda a los usuarios con dudas sobre la app, cómo contratar profesionales o cómo ofrecer sus servicios.",
      },
    });
    return response.text || "No pude generar una respuesta en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error al contactar al asistente. Por favor, intenta más tarde.";
  }
};
