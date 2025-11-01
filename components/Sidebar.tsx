import React, { useState, useEffect, useMemo } from 'react';
import { ChatIcon } from './icons/ChatIcon.tsx';
import { ProIcon } from './icons/ProIcon.tsx';
import { ImageEditIcon } from './icons/ImageEditIcon.tsx';
import { VideoIcon } from './icons/VideoIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import * as chatHistoryService from '../services/chatHistoryService.ts';
import { ChatSession } from '../types.ts';


type ViewType = 'chat' | 'fast-chat' | 'pro-chat' | 'image-edit' | 'video-edit';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setOpen, activeChatId, setActiveChatId }) => {
  const [history, setHistory] = useState<ChatSession[]>([]);

  const navItems = [
    { id: 'chat', icon: <ChatIcon className="w-5 h-5 mr-3" />, label: 'Spark Flash' },
    { id: 'fast-chat', icon: <ChatIcon className="w-5 h-5 mr-3 text-cyan-400" />, label: 'Spark Lite (Stream)' },
    { id: 'pro-chat', icon: <ProIcon className="w-5 h-5 mr-3" />, label: 'Spark 2.5 Pro' },
    { id: 'image-edit', icon: <ImageEditIcon className="w-5 h-5 mr-3" />, label: 'Spark Image Editor' },
    { id: 'video-edit', icon: <VideoIcon className="w-5 h-5 mr-3" />, label: 'Spark Video Editor' },
  ];

  const activeModel = useMemo(() => {
    switch (activeView) {
      case 'chat': return 'gemini-2.5-flash';
      case 'fast-chat': return 'gemini-flash-lite-latest';
      case 'pro-chat': return 'gemini-2.5-pro';
      default: return null;
    }
  }, [activeView]);

  useEffect(() => {
    const refreshHistory = () => {
      if (activeModel) {
        setHistory(chatHistoryService.getHistoryForModel(activeModel));
      } else {
        setHistory([]);
      }
    };
    refreshHistory();
    // Re-check on an interval in case another tab updated the history
    const intervalId = setInterval(refreshHistory, 2000);
    return () => clearInterval(intervalId);
  }, [activeView, activeModel]);
  
  const handleItemClick = (view: ViewType) => {
    setActiveView(view);
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    chatHistoryService.deleteChatSession(chatId);
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    if (activeModel) {
      setHistory(chatHistoryService.getHistoryForModel(activeModel));
    }
  };


  const sidebarClasses = `
    absolute md:relative z-20 md:z-auto h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black/80 backdrop-blur-md
    border-r border-gray-700/50 flex flex-col transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
  `;

  return (
    <>
      <div className={sidebarClasses} style={{ width: '260px' }}>
        <div className="p-4 border-b border-gray-700/50">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            Spark AI Studio
          </h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-hidden">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id as ViewType)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${activeView === item.id
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800/70 hover:text-white'
                  }`}
              >
                <div className={`absolute left-0 w-1 h-6 rounded-r-full bg-indigo-400 transition-all duration-300 ${activeView === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {history.length > 0 && (
            <div className="px-4 pb-4 flex-1 overflow-y-auto">
              <div className="h-px bg-gray-700/50 my-2"></div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">History</h2>
              <div className="space-y-1">
                {history.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setActiveChatId(session.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors group ${
                      activeChatId === session.id ? 'bg-gray-800/80 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{session.title}</span>
                    <div onClick={(e) => handleDelete(e, session.id)} className="p-1 rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400">
                      <TrashIcon className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700/50 text-xs text-gray-500">
          <p>&copy; 2024 AI Studio Clone</p>
        </div>
      </div>
      {/* Overlay for mobile */}
      {isOpen && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/60 z-10 md:hidden"></div>}
    </>
  );
};

export default Sidebar;