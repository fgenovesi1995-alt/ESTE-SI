import { GoogleGenAI } from "@google/genai";

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second throttling

export const getAIResponse = async (userPrompt: string) => {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL));
  }
  lastRequestTime = Date.now();

  if (!API_KEY) {
    return "Lo siento, la clave de API no está configurada. Por favor, agregá VITE_GEMINI_API_KEY a tu archivo .env.local.";
  }

  console.log("[Gemini] Using API Key (VITE_GEMINI_API_KEY):", API_KEY.substring(0, 8) + "...");

  // Prepend instruction to prompt for maximum compatibility across all API versions
  const systemPrefix = "INSTRUCCIONES DE SISTEMA: Sos un asistente de Arreglados, una app de reparaciones en el hogar. Ayudá al usuario a encontrar profesionales o diagnosticar problemas simples. Respondé siempre en español rioplatense (argentino) y sé amable.\n\nMENSAJE DEL USUARIO:\n";
  const enrichedPrompt = systemPrefix + userPrompt;

  const apiVersions = ["v1", "v1beta"];
  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-002",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  for (const version of apiVersions) {
    console.log(`[Gemini] --- Testing API Version: ${version} ---`);
    const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: version as any });

    for (const modelName of modelsToTry) {
      // Try both direct name and models/ prefix
      const variants = [modelName, `models/${modelName}`];

      for (const variant of variants) {
        try {
          console.log(`[Gemini] [${version}] Attempting: ${variant}...`);

          // Using a clean payload without systemInstruction field to avoid 400 errors in v1
          const response = await ai.models.generateContent({
            model: variant,
            contents: [{ role: "user", parts: [{ text: enrichedPrompt }] }]
          });

          console.log(`[Gemini] [${version}] SUCCESS with ${variant}`);
          return response.text || "No pude generar una respuesta en este momento.";
        } catch (error: any) {
          console.warn(`[Gemini] [${version}] ${variant} failed:`, error.message || error);

          if (error.message && error.message.includes("limit: 0")) {
            console.error(`[Gemini] CRITICAL: Quota is ZERO for ${variant} on ${version}.`);
          }
        }
      }
    }
  }

  return "No pude conectar con ningún modelo de IA. Por favor, verificá que el 'Generative Language API' esté habilitado para tu API Key en Google AI Studio Settings.";
};
