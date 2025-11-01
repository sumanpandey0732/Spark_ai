
export enum MessageAuthor {
  USER = 'user',
  BOT = 'bot',
}

export interface Part {
  text?: string;
  inlineData?: {
    data: string; // base64 encoded
    mimeType: string;
  };
}

export interface ChatMessage {
  author: MessageAuthor;
  parts: Part[];
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: ChatMessage[];
    model: string;
}
