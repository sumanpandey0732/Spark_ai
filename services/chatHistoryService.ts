import { ChatMessage, MessageAuthor, ChatSession } from '../types.ts';

const HISTORY_STORAGE_KEY = 'spark_ai_studio_chat_history';

// The entire history is a map from chatId to ChatSession
type ChatHistory = Record<string, ChatSession>;

function readHistory(): ChatHistory {
  try {
    const rawHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    return rawHistory ? JSON.parse(rawHistory) : {};
  } catch (e) {
    console.error("Failed to read chat history from localStorage", e);
    return {};
  }
}

function writeHistory(history: ChatHistory): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to write chat history to localStorage", e);
  }
}

export function getHistoryForModel(model: string): ChatSession[] {
  const history = readHistory();
  return Object.values(history)
    .filter(session => session.model === model)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getChatSession(chatId: string): ChatSession | undefined {
  const history = readHistory();
  return history[chatId];
}

export function saveChatSession(session: ChatSession): void {
  const history = readHistory();
  history[session.id] = session;
  writeHistory(history);
}

export function deleteChatSession(chatId: string): void {
  const history = readHistory();
  delete history[chatId];
  writeHistory(history);
}

export function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(m => m.author === MessageAuthor.USER);
  const firstTextPart = firstUserMessage?.parts.find(p => p.text);

  if (firstTextPart?.text) {
    // Take first 5 words, remove slashes, and trim
    const title = firstTextPart.text.split(' ').slice(0, 5).join(' ').replace(/[/]/g, '').trim();
    return title || "Untitled Chat";
  }

  const firstImagePart = firstUserMessage?.parts.find(p => p.inlineData?.mimeType.startsWith('image/'));
  if (firstImagePart) {
    return `Chat with an image`;
  }
  
  return "New Chat";
}