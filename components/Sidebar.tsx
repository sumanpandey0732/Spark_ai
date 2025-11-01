import React from 'react';
import { ChatIcon } from './icons/ChatIcon';
import { ProIcon } from './icons/ProIcon';
import { ImageEditIcon } from './icons/ImageEditIcon';

type ViewType = 'chat' | 'fast-chat' | 'pro-chat' | 'image-edit';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setOpen }) => {
  const navItems = [
    { id: 'chat', icon: <ChatIcon className="w-5 h-5 mr-3" />, label: 'Spark Flash' },
    { id: 'fast-chat', icon: <ChatIcon className="w-5 h-5 mr-3 text-cyan-400" />, label: 'Spark Lite (Stream)' },
    { id: 'pro-chat', icon: <ProIcon className="w-5 h-5 mr-3" />, label: 'Spark 2.5 Pro' },
    { id: 'image-edit', icon: <ImageEditIcon className="w-5 h-5 mr-3" />, label: 'Spark Image Editor' },
  ];

  const handleItemClick = (view: ViewType) => {
    setActiveView(view);
    if (window.innerWidth < 768) { // md breakpoint
      setOpen(false);
    }
  };

  const sidebarClasses = `
    absolute md:relative z-10 md:z-auto h-full bg-gray-900/95 backdrop-blur-sm md:bg-gray-900 
    border-r border-gray-700/50 flex flex-col transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
  `;

  return (
    <>
      <div className={sidebarClasses} style={{ width: '260px' }}>
        <div className="p-4 border-b border-gray-700/50">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            Spark AI
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id as ViewType)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                ${activeView === item.id
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700/50 text-xs text-gray-500">
          <p>&copy; 2024 AI Studio Clone</p>
        </div>
      </div>
      {isOpen && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/50 z-0 md:hidden"></div>}
    </>
  );
};

export default Sidebar;