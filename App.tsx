import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import ChatView from './components/ChatView.tsx';
import ImageEditorView from './components/ImageEditorView.tsx';
import VideoEditorView from './components/VideoEditorView.tsx';
import ApiKeyPrompt from './components/ApiKeyPrompt.tsx';
import { MenuIcon } from './components/icons/MenuIcon.tsx';

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

type ViewType = 'chat' | 'fast-chat' | 'pro-chat' | 'image-edit' | 'video-edit';

const App: React.FC = () => {
  const [activeView, _setActiveView] = useState<ViewType>('chat');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey);
        } catch (error) {
            console.error("Error checking for API key:", error);
            setIsKeySelected(false);
        }
      } else {
        console.warn('AI Studio context not found. API key selection is required.');
        setIsKeySelected(false); 
      }
    };
    checkApiKey();
  }, []);

  const systemInstruction = "When any user asks who developed you or who created you, you must answer 'I am developed by Santosh Pandey'. For all other questions, be a helpful AI assistant.";

  const setActiveView = (view: ViewType) => {
    _setActiveView(view);
    setActiveChatId(null);
  };

  const renderView = () => {
    const chatKey = `${activeView}-${activeChatId || 'new'}`;
    switch (activeView) {
      case 'chat':
        return <ChatView key={chatKey} model="gemini-2.5-flash" title="Spark Flash" subtitle="Quick and efficient for everyday tasks." useStreaming={false} systemInstruction={systemInstruction} chatId={activeChatId} setChatId={setActiveChatId} />;
      case 'fast-chat':
        return <ChatView key={chatKey} model="gemini-flash-lite-latest" title="Spark Lite" subtitle="For low-latency, streaming responses." useStreaming={true} systemInstruction={systemInstruction} chatId={activeChatId} setChatId={setActiveChatId} />;
      case 'pro-chat':
        return <ChatView key={chatKey} model="gemini-2.5-pro" title="Spark 2.5 Pro" subtitle="The most capable model for complex reasoning." useStreaming={false} systemInstruction={systemInstruction} chatId={activeChatId} setChatId={setActiveChatId} />;
      case 'image-edit':
        return <ImageEditorView />;
      case 'video-edit':
        return <VideoEditorView />;
      default:
        return <ChatView key={chatKey} model="gemini-2.5-flash" title="Spark Flash" subtitle="Quick and efficient for everyday tasks." useStreaming={false} systemInstruction={systemInstruction} chatId={activeChatId} setChatId={setActiveChatId}/>;
    }
  };

  if (isKeySelected === null) {
    return (
        <div className="flex flex-col h-full bg-gray-900 text-white justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
          <p className="mt-4">Initializing Spark AI Studio...</p>
        </div>
    );
  }
  
  if (!isKeySelected) {
      return <ApiKeyPrompt onKeySelect={() => setIsKeySelected(true)} />;
  }

  return (
    <div className="flex h-full font-sans text-white bg-gray-900">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen} 
        setOpen={setSidebarOpen}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
      />
      <main className="flex-1 flex flex-col h-full relative">
        <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="md:hidden absolute top-4 left-4 z-20 p-2 rounded-md bg-gray-800/50 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-label="Toggle sidebar"
        >
            <MenuIcon className="h-6 w-6" />
        </button>
        {renderView()}
      </main>
    </div>
  );
};

export default App;