import React from 'react';

interface ApiKeyPromptProps {
  onKeySelect: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onKeySelect }) => {
  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      onKeySelect();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white justify-center items-center">
      <div className="text-center bg-gray-800/50 p-8 rounded-lg shadow-2xl max-w-lg mx-4">
        <h2 className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          API Key Required
        </h2>
        <p className="text-gray-300 mb-6">
          To use Spark AI Studio, you need to select a Gemini API key. 
          Your key is stored securely and only used to communicate with the Gemini API.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Using the Gemini API may incur costs. For more details, please see the 
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline ml-1">
            billing documentation
          </a>.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full px-5 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors font-semibold text-lg"
        >
          Select API Key
        </button>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
