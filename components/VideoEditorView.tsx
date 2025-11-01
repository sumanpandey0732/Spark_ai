import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { VideoIcon } from './icons/VideoIcon';

// Fix: Moved the AIStudio interface into the global declaration to prevent type conflicts
// that arise when multiple modules augment the global Window type.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const VideoEditorView: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeySelected(hasKey);
            } else {
                setIsKeySelected(false);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
            setGeneratedVideoUrl(null);
            setError(null);
        }
    };
    
    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    const handleSubmit = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setLoadingMessage('Starting video generation...');

        try {
            const videoUrl = await generateVideo(prompt, imageFile, (message) => {
                setLoadingMessage(message);
            });
            setGeneratedVideoUrl(videoUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            if (errorMessage.includes("API key not valid or found")) {
                setIsKeySelected(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [imageFile, prompt]);

    if (isKeySelected === null) {
        return (
             <div className="flex flex-col h-full bg-gray-800/50 text-white justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                <p className="mt-4">Checking API key status...</p>
             </div>
        );
    }
    
    if (!isKeySelected) {
        return (
            <div className="flex flex-col h-full bg-gray-800/50 text-white">
                <header className="py-4 pr-4 pl-16 md:p-4 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/30">
                    <h2 className="text-lg font-semibold">Spark Video Editor</h2>
                    <p className="text-sm text-gray-400">Generate stunning videos from text prompts and images.</p>
                </header>
                <div className="flex-1 flex justify-center items-center">
                    <div className="text-center bg-gray-900/30 p-8 rounded-lg">
                        <h3 className="text-xl font-bold mb-2">API Key Required</h3>
                        <p className="text-gray-400 mb-4 max-w-md">
                            To use the video generation feature, you need to select an API key. 
                            Video generation is a billable service. For more details, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">billing documentation</a>.
                        </p>
                        <button
                            onClick={handleSelectKey}
                            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
                        >
                            Select API Key
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-800/50 text-white">
            <header className="py-4 pr-4 pl-16 md:p-4 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/30">
                <h2 className="text-lg font-semibold">Spark Video Editor</h2>
                <p className="text-sm text-gray-400">Generate stunning videos from text prompts and images.</p>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Input Side */}
                    <div className="flex flex-col gap-4 bg-gray-900/30 p-4 rounded-lg">
                        <div 
                            onClick={triggerFileInput}
                            className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors bg-gray-800/50"
                        >
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            {imageUrl ? (
                                <img src={imageUrl} alt="Initial frame" className="max-h-full max-w-full object-contain rounded-lg" />
                            ) : (
                                <div className="text-center p-8">
                                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                                    <p className="mt-2 text-sm text-gray-400">Add an optional starting image</p>
                                    <p className="text-xs text-gray-500">Click to upload or drag and drop</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                           <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A cinematic shot of a car driving on a rainy night..."
                                className="w-full bg-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows={3}
                                disabled={isLoading}
                            />
                             <button
                                onClick={handleSubmit}
                                disabled={isLoading || !prompt.trim()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                                <VideoIcon className="w-5 h-5"/>
                                {isLoading ? 'Generating...' : 'Generate Video'}
                            </button>
                        </div>
                    </div>

                    {/* Output Side */}
                    <div className="flex flex-col justify-center items-center bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                        {isLoading && (
                             <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto"></div>
                                <p className="mt-4 text-gray-300">{loadingMessage}</p>
                             </div>
                        )}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        {generatedVideoUrl && !isLoading && (
                            <video src={generatedVideoUrl} controls autoPlay loop className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
                        )}
                        {!generatedVideoUrl && !isLoading && !error && (
                            <div className="text-center text-gray-500">
                                <VideoIcon className="mx-auto h-12 w-12" />
                                <p className="mt-2">Your generated video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoEditorView;