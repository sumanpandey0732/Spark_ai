import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageEditorView from './components/ImageEditorView';
import VideoEditorView from './components/VideoEditorView';
import { MenuIcon } from './components/icons/MenuIcon';

type ViewType = 'chat' | 'fast-chat' | 'pro-chat' | 'image-edit' | 'video-edit';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const systemInstruction = "When any user asks who developed you or who created you, you must answer 'I am developed by Santosh Pandey'. For all other questions, be a helpful AI assistant.";

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatView key="chat" model="gemini-2.5-flash" title="Spark Flash" subtitle="Quick and efficient for everyday tasks." useStreaming={false} systemInstruction={systemInstruction} />;
      case 'fast-chat':
        return <ChatView key="fast-chat" model="gemini-flash-lite-latest" title="Spark Lite" subtitle="For low-latency, streaming responses." useStreaming={true} systemInstruction={systemInstruction} />;
      case 'pro-chat':
        return <ChatView key="pro-chat" model="gemini-2.5-pro" title="Spark 2.5 Pro" subtitle="The most capable model for complex reasoning." useStreaming={false} systemInstruction={systemInstruction} />;
      case 'image-edit':
        return <ImageEditorView />;
      case 'video-edit':
        return <VideoEditorView />;
      default:
        return <ChatView key="default-chat" model="gemini-2.5-flash" title="Spark Flash" subtitle="Quick and efficient for everyday tasks." useStreaming={false} systemInstruction={systemInstruction} />;
    }
  };

  return (
    <div className="flex h-full font-sans text-white bg-gray-900">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
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