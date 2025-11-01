import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, Part } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createChat, generateImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { ChatMessage, MessageAuthor } from '../types';
import { SendIcon } from './icons/SendIcon';
import { ProIcon } from './icons/ProIcon';
import { ChatIcon } from './icons/ChatIcon';
import { AttachmentIcon } from './icons/AttachmentIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CloseIcon } from './icons/CloseIcon';
import CodeBlock from './CodeBlock';
import { NewChatIcon } from './icons/NewChatIcon';


interface ChatViewProps {
  model: string;
  title: string;
  subtitle: string;
  useStreaming: boolean;
  systemInstruction?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ model, title, subtitle, useStreaming, systemInstruction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const chatInstanceRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to initialize chat and load history when the model changes
  useEffect(() => {
    const loadedMessages = JSON.parse(localStorage.getItem(`chatHistory_${model}`) || '[]') as ChatMessage[];
    setMessages(loadedMessages);
    chatInstanceRef.current = createChat(model, systemInstruction, loadedMessages);
    setError(null);
    setInput('');
    setAttachedFile(null);
    setPreviewUrl(null);
  }, [model, systemInstruction]);
  
  // Effect to save chat history to localStorage when messages change
  useEffect(() => {
    // We use a short timeout to batch updates and prevent saving an empty array on quick model switches
    const timer = setTimeout(() => {
      if (messages.length > 0) {
        localStorage.setItem(`chatHistory_${model}`, JSON.stringify(messages));
      } else {
        // This ensures that if a chat is cleared, its storage is also cleared.
        localStorage.removeItem(`chatHistory_${model}`);
      }
    }, 100); // 100ms debounce
    return () => clearTimeout(timer);
  }, [messages, model]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (attachedFile) {
        const url = URL.createObjectURL(attachedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setPreviewUrl(null);
    }
  }, [attachedFile]);

  const handleSendMessage = useCallback(async (message: string) => {
    if ((!message.trim() && !attachedFile) || isLoading) return;

    setError(null);
    setIsLoading(true);

    const lowerCaseMessage = message.trim().toLowerCase();
    const isImageGenerationRequest = lowerCaseMessage.startsWith('/generate ') || lowerCaseMessage.startsWith('generate image');
    const hasAttachment = !!attachedFile;

    // --- User Message ---
    const userParts: Part[] = [];
    if (hasAttachment && attachedFile) {
        const base64Data = await fileToBase64(attachedFile);
        userParts.push({ inlineData: { data: base64Data, mimeType: attachedFile.type } });
    }
    if (message.trim()) {
        userParts.push({ text: message.trim() });
    }

    setMessages(prev => [...prev, { author: MessageAuthor.USER, parts: userParts }]);
    setInput('');
    setAttachedFile(null);

    try {
      if (isImageGenerationRequest && !hasAttachment) {
          let prompt = message.trim();
          if (lowerCaseMessage.startsWith('/generate ')) {
              prompt = message.trim().substring('/generate '.length).trim();
          } else if (lowerCaseMessage.startsWith('generate image')) {
              prompt = message.trim().substring('generate image'.length).trim();
              if (prompt.toLowerCase().startsWith('of ')) {
                  prompt = prompt.substring(3).trim();
              }
          }

          if (!prompt) {
            setError("Please provide a prompt to generate an image.");
            setIsLoading(false);
            setMessages(prev => prev.slice(0, -1)); // Remove the user message
            return;
          }
          
          const imagePart = await generateImage(prompt);
          setMessages(prev => [...prev, { author: MessageAuthor.BOT, parts: [imagePart] }]);
      } else {
        if (!chatInstanceRef.current) throw new Error("Chat not initialized");

        if (useStreaming && !hasAttachment) {
          setMessages(prev => [...prev, { author: MessageAuthor.BOT, parts: [{ text: "" }] }]);
          const stream = await chatInstanceRef.current.sendMessageStream({ message });
          for await (const chunk of stream) {
              setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.author === MessageAuthor.BOT && lastMessage.parts[0]?.text !== undefined) {
                      lastMessage.parts[0].text += chunk.text;
                  }
                  return newMessages;
              });
          }
        } else {
          // This branch handles non-streaming AND streaming with an attachment.
          const partsForApi: Part[] = [];
          if (message.trim()) {
            partsForApi.push({ text: message.trim() });
          }
          if (hasAttachment && attachedFile) {
            const base64Data = await fileToBase64(attachedFile);
            partsForApi.push({ inlineData: { data: base64Data, mimeType: attachedFile.type } });
          }
          
          const response = await chatInstanceRef.current.sendMessage({ message: partsForApi });
          setMessages(prev => [...prev, { author: MessageAuthor.BOT, parts: response.candidates[0].content.parts }]);
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMsg);
      setMessages(prev => prev.slice(0, -1)); 
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, useStreaming, attachedFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setAttachedFile(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleDownload = (base64Data: string, mimeType: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64Data}`;
    link.download = `generated-image.${mimeType.split('/')[1] || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewChat = () => {
    setMessages([]); // This will trigger the save effect to clear localStorage
    chatInstanceRef.current = createChat(model, systemInstruction); // Creates a fresh instance
    setError(null);
    setInput('');
    setAttachedFile(null);
  };

  const renderPart = (part: Part, index: number) => {
    if (part.text) {
        return (
             <ReactMarkdown
                key={index}
                remarkPlugins={[remarkGfm]}
                className="prose prose-invert prose-sm max-w-none"
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <CodeBlock language={match[1]}>
                                {String(children).replace(/\n$/, '')}
                            </CodeBlock>
                        ) : (
                            <code className="bg-gray-800/50 rounded px-1.5 py-1 font-mono text-sm before:content-[''] after:content-['']" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
              >
                {part.text}
              </ReactMarkdown>
        );
    }
    if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        const dataUrl = `data:${mimeType};base64,${data}`;
        if (mimeType.startsWith('image/')) {
            return (
                <div key={index} className="relative group">
                    <img src={dataUrl} alt="content" className="rounded-lg max-w-sm max-h-sm" />
                    <button 
                      onClick={() => handleDownload(data, mimeType)}
                      className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Download image"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            )
        }
        if (mimeType.startsWith('audio/')) {
            return <audio key={index} controls src={dataUrl} className="w-full max-w-sm"/>
        }
         if (mimeType.startsWith('video/')) {
            return <video key={index} controls src={dataUrl} className="rounded-lg max-w-sm"/>
        }
        return <p key={index} className="text-xs text-gray-400 italic">[Unsupported file type: {mimeType}]</p>
    }
    return null;
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-800/50">
      <header className="py-4 pr-4 pl-16 md:p-4 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/30 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <button 
          onClick={handleNewChat}
          className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
          aria-label="Start new chat"
        >
          <NewChatIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.author === MessageAuthor.USER ? 'justify-end' : ''}`}>
            {msg.author === MessageAuthor.BOT && (
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                {model.includes('pro') ? <ProIcon className="w-5 h-5"/> : <ChatIcon className="w-5 h-5"/>}
              </div>
            )}
            <div className={`flex flex-col gap-2 max-w-xl p-3 rounded-2xl shadow-md ${msg.author === MessageAuthor.USER 
              ? 'bg-indigo-600 rounded-br-none' 
              : 'bg-gray-700 rounded-bl-none'
            }`}>
              <div className="text-white whitespace-pre-wrap space-y-2">
                {msg.parts.map(renderPart)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {isLoading && messages[messages.length-1]?.author === MessageAuthor.USER && (
            <div className="flex items-start gap-3">
                 <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    {model.includes('pro') ? <ProIcon className="w-5 h-5"/> : <ChatIcon className="w-5 h-5"/>}
                 </div>
                 <div className="max-w-xl p-3 rounded-2xl bg-gray-700 rounded-bl-none flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                 </div>
            </div>
        )}
      </div>

      <div className="p-4 md:p-6 border-t border-gray-700/50 bg-gray-900/30">
        {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
        {attachedFile && previewUrl && (
            <div className="mb-2 p-2 bg-gray-700/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    {attachedFile.type.startsWith('image/') ? (
                        <img src={previewUrl} alt="preview" className="w-10 h-10 rounded object-cover"/>
                    ) : (
                        <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center">
                            <AttachmentIcon className="w-5 h-5 text-gray-300"/>
                        </div>
                    )}
                    <span className="text-sm text-gray-300 truncate">{attachedFile.name}</span>
                </div>
                <button onClick={removeAttachment} className="p-1 rounded-full hover:bg-gray-600 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center bg-gray-700/50 rounded-lg p-1">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-600 transition-colors">
            <AttachmentIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Processing..." : attachedFile ? "Describe the file or ask a question..." : "Ask me anything..."}
            className="flex-1 bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || (!input.trim() && !attachedFile)} className="p-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;