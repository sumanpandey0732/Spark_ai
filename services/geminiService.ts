import { GoogleGenAI, Chat, Modality, Part, Content, OperationsOperation } from "@google/genai";
import { fileToBase64 } from '../utils/fileUtils.ts';
import { ChatMessage, MessageAuthor } from "../types.ts";

const getApiKey = (): string => {
  // This function is designed to work in an environment where process.env.API_KEY is injected.
  // The global API key prompt in App.tsx ensures this will be populated when calls are made.
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  console.warn("API Key not found in process.env");
  return ""; 
};

export const createChat = (model: string, systemInstruction?: string, history?: ChatMessage[]): Chat => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
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

export const generateVideo = async (
  prompt: string,
  imageFile: File | null,
  onProgress: (message: string) => void
): Promise<string> => {
  // A new AI instance is created to get the latest key.
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    onProgress("Initializing video generation...");

    const imagePart = imageFile ? {
      imageBytes: await fileToBase64(imageFile),
      mimeType: imageFile.type,
    } : undefined;

    let operation: OperationsOperation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      ...(imagePart && { image: imagePart }),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    onProgress("Your request is being processed. This can take a few minutes...");
    
    const reassuringMessages = [
      "Brewing up your video...",
      "Composing the digital symphony...",
      "Assembling pixels into motion...",
      "Almost there, adding the final touches...",
      "The digital film is developing..."
    ];
    let messageIndex = 0;

    const intervalId = setInterval(() => {
        onProgress(reassuringMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % reassuringMessages.length;
    }, 15000);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    clearInterval(intervalId);

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    onProgress("Fetching your video...");

    const videoResponse = await fetch(`${downloadLink}&key=${getApiKey()}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video from URI. Status: ${videoResponse.status}`);
    }
    const videoBlob = await videoResponse.blob();
    
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error && (error.message.includes("Requested entity was not found") || error.message.includes("API key not valid"))) {
        throw new Error("API key not valid or found. Please select a valid API key and try again.");
    }
    throw new Error(error instanceof Error ? error.message : "Failed to generate video. Please check the console for details.");
  }
};

export const editImage = async (
  imageFile: File,
  prompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
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