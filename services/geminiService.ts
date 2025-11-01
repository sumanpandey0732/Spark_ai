import { GoogleGenAI, Chat, Modality, Part, Content } from "@google/genai";
import { fileToBase64 } from '../utils/fileUtils';
import { ChatMessage, MessageAuthor } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const createChat = (model: string, systemInstruction?: string, history?: ChatMessage[]): Chat => {
  const formattedHistory: Content[] = history?.map(msg => ({
    // The role must be 'user' or 'model'. Our internal 'bot' maps to 'model'.
    role: msg.author === MessageAuthor.USER ? 'user' : 'model',
    parts: msg.parts,
  })) || [];

  return ai.chats.create({
    model: model,
    history: formattedHistory,
    config: {
      ...(systemInstruction && { systemInstruction }),
    },
  });
};

export const generateImage = async (prompt: string): Promise<Part> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part as Part;
      }
    }
    throw new Error("No image data returned from API.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. Please check the console for details.");
  }
};

export const editImage = async (
  imageFile: File,
  prompt: string
): Promise<string> => {
  try {
    const base64Data = await fileToBase64(imageFile);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data returned from API.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit image. Please check the console for details.");
  }
};