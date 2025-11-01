import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ClipboardIcon } from './icons/ClipboardIcon.tsx';

interface CodeBlockProps {
    language: string;
    children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (typeof children === 'string') {
            navigator.clipboard.writeText(children);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="my-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-700/50">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-xs text-gray-400">
                <span className="font-sans">{language}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white transition-colors disabled:text-gray-500" disabled={isCopied}>
                    <ClipboardIcon className="w-4 h-4" />
                    {isCopied ? 'Copied!' : 'Copy code'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#111827' /* bg-gray-900 */ }}
                codeTagProps={{ style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' } }}
            >
                {String(children)}
            </SyntaxHighlighter>
        </div>
    );
};

export default CodeBlock;