
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedDeliveryData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development and will show an alert.
  // In a real production environment, the key should be securely managed.
  console.warn("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Fix: Updated model to a recommended one for multimodal tasks.
const model = 'gemini-3-flash-preview';

export const processImageForSpreadsheet = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedDeliveryData[]> => {
  if (!API_KEY) {
    throw new Error("A chave da API do Google Gemini não está configurada.");
  }

  const prompt = `
    Analise a imagem, que pode conter uma ou mais etiquetas ou itens de entrega.
    Para cada item de entrega individual que você identificar, extraia as seguintes informações:
    1. "date": A data da entrega. Formate-a como DD/MM. Se o ano for visível, ignore-o.
    2. "collection": O endereço de COLETA. Geralmente é o primeiro endereço ou o remetente.
    3. "destination": O endereço de DESTINO. Geralmente é o segundo endereço ou o destinatário.
    4. "total": O valor total do serviço, se presente. Procure por números, possivelmente precedidos por "R$". Se não houver valor explícito, retorne "0".
    5. "observation": Qualquer observação, nota adicional, ou detalhe relevante (ex: "frágil", "deixar na portaria"). Se não houver observação, retorne uma string vazia.

    Seja claro na distinção entre coleta e destino.
    Retorne os dados como um array de objetos JSON, mesmo que encontre apenas um item.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "A data da entrega no formato DD/MM." },
              collection: { type: Type.STRING, description: "O endereço de coleta." },
              destination: { type: Type.STRING, description: "O endereço de destino/destinatário." },
              total: { type: Type.STRING, description: "O valor total do serviço como uma string numérica." },
              observation: { type: Type.STRING, description: "Qualquer observação ou nota. Pode ser uma string vazia." }
            },
            required: ["date", "collection", "destination", "total", "observation"]
          }
        }
      }
    });

    if (response.text) {
      const jsonText = response.text.trim();
      const parsedData = JSON.parse(jsonText) as ExtractedDeliveryData[];
      return parsedData;
    } else {
      throw new Error("A resposta da IA está vazia ou em formato inválido.");
    }

  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    throw new Error("Falha ao processar a imagem com a IA. Verifique o console para mais detalhes.");
  }
};