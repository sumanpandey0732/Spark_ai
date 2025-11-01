import React, { useState, useCallback, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { ImageEditIcon } from './icons/ImageEditIcon';

const ImageEditorView: React.FC = () => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setOriginalImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setGeneratedImageUrl(null);
            setError(null);
        }
    };
    
    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    const handleSubmit = useCallback(async () => {
        if (!originalImageFile || !prompt.trim()) {
            setError('Please upload an image and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            const base64Image = await editImage(originalImageFile, prompt);
            setGeneratedImageUrl(`data:image/png;base64,${base64Image}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [originalImageFile, prompt]);

    return (
        <div className="flex flex-col h-full bg-gray-800/50 text-white">
            <header className="py-4 pr-4 pl-16 md:p-4 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/30">
                <h2 className="text-lg font-semibold">Spark Image Editor</h2>
                <p className="text-sm text-gray-400">Bring your creative ideas to life with text prompts.</p>
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
                            {originalImageUrl ? (
                                <img src={originalImageUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
                            ) : (
                                <div className="text-center p-8">
                                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                                    <p className="mt-2 text-sm text-gray-400">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                           <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Add a retro filter, make it black and white..."
                                className="w-full bg-gray-700/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isLoading}
                            />
                             <button
                                onClick={handleSubmit}
                                disabled={isLoading || !originalImageFile || !prompt.trim()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                                <ImageEditIcon className="w-5 h-5"/>
                                {isLoading ? 'Generating...' : 'Generate Image'}
                            </button>
                        </div>
                    </div>

                    {/* Output Side */}
                    <div className="flex flex-col justify-center items-center bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                        {isLoading && (
                             <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto"></div>
                                <p className="mt-4 text-gray-300">Spark is thinking...</p>
                             </div>
                        )}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        {generatedImageUrl && !isLoading && (
                            <img src={generatedImageUrl} alt="Generated" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
                        )}
                        {!generatedImageUrl && !isLoading && !error && (
                            <div className="text-center text-gray-500">
                                <ImageEditIcon className="mx-auto h-12 w-12" />
                                <p className="mt-2">Your edited image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorView;