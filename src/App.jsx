import React, { useState, useRef, useEffect } from 'react';
import { Upload, Zap, Download, Loader, AlertCircle } from 'lucide-react';

const StyleTransformer = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [transformedText, setTransformedText] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [showApiSetup, setShowApiSetup] = useState(!apiKey);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(err => {
        console.log('Service worker registration failed:', err);
      });
    }
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey);
      setShowApiSetup(false);
      setError('');
    } else {
      setError('Please enter an API key');
    }
  };

  const transformStyle = async (text) => {
    if (!text.trim()) {
      setError('Please provide some text to transform');
      return;
    }

    if (!apiKey) {
      setError('Please set your API key first');
      setShowApiSetup(true);
      return;
    }

    setProcessing(true);
    setError('');
    setProgress(0);
    setTransformedText('');

    try {
      const chunkSize = 3000;
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
      }

      let fullTransformed = '';

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setProgress(Math.round((i / chunks.length) * 100));

        const response = await fetch('/api/transform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `You are an expert at transforming dense, academic writing into the engaging, conversational style of Mark Manson. 

Mark Manson's style includes:
- Casual, conversational tone (like talking to a friend)
- Strategic use of profanity and humor to make points stick
- Direct, no-BS approach to complex topics
- Short, punchy sentences mixed with thoughtful longer ones
- Relatable examples and personal touches
- Self-deprecating humor and honesty
- Breaking down complex ideas into digestible pieces
- Questioning assumptions and conventional wisdom
- Making readers feel understood and heard

Your job: Take the academic text and rewrite it in Mark Manson's voice. Keep the core ideas and meaning intact, but make it readable, memorable, and actually enjoyable.`,
            messages: [
              {
                role: 'user',
                content: `Transform this academic text into Mark Manson's style:\n\n${chunk}`
              }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'API error');
        }

        const data = await response.json();
        const transformed = data.content[0].text;
        fullTransformed += transformed + '\n\n';
        setTransformedText(fullTransformed);
      }

      setProgress(100);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setTransformedText('');
    } finally {
      setProcessing(false);
    }
  };

  const handlePasteAndTransform = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError('Clipboard is empty. Copy some text first!');
        return;
      }
      await transformStyle(text);
    } catch (err) {
      setError('Could not read clipboard. Make sure you have text copied.');
    }
  };

  const handleTextAreaTransform = (textArea) => {
    const text = textArea.value;
    transformStyle(text);
  };

  const downloadTransformed = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transformedText));
    element.setAttribute('download', `${fileName.replace('.pdf', '')}_manson_style.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transformedText);
    setError('Copied to clipboard!');
    setTimeout(() => setError(''), 2000);
  };

  if (showApiSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-purple-300 mb-2">Style Transformer</h1>
          <p className="text-purple-200/70 mb-6">First time setup: Add your Anthropic API key</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-purple-300 mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-black/40 border border-purple-500/30 rounded-lg p-3 text-purple-100 placeholder-purple-400/40 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 font-mono text-sm"
              />
              <p className="text-xs text-purple-300/60 mt-2">
                Get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">console.anthropic.com</a>
              </p>
            </div>

            <button
              onClick={saveApiKey}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Save & Continue
            </button>

            <p className="text-xs text-purple-300/50 text-center">
              Your API key is saved locally. Never shared or stored on servers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        <div className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Style Transformer
                </h1>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('anthropic_api_key');
                  setApiKey('');
                  setShowApiSetup(true);
                }}
                className="text-xs bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 px-3 py-2 rounded-lg transition-all"
              >
                Change API Key
              </button>
            </div>
            <p className="text-purple-200/70 text-sm sm:text-base">
              Turn dense academic writing into Mark Manson's conversational, no-BS style.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                <h2 className="text-lg sm:text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Your Text
                </h2>
                <textarea
                  id="inputText"
                  placeholder="Paste your academic text here..."
                  className="w-full h-64 sm:h-80 bg-black/40 border border-purple-500/30 rounded-xl p-4 text-purple-100 placeholder-purple-400/40 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20 resize-none font-mono text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={() => handleTextAreaTransform(document.getElementById('inputText'))}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Transforming...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Transform
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePasteAndTransform}
                    disabled={processing}
                    className="flex-1 bg-blue-600/40 hover:bg-blue-600/60 disabled:opacity-50 disabled:cursor-not-allowed text-blue-100 font-bold py-3 px-6 rounded-lg transition-all border border-blue-500/40 hover:border-blue-500/60 text-sm sm:text-base"
                  >
                    Paste & Go
                  </button>
                </div>
              </div>

              {processing && (
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-purple-300">Processing...</span>
                    <span className="text-sm font-bold text-purple-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {error && !error.includes('Copied') && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {error && error.includes('Copied') && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex gap-3">
                  <div className="w-5 h-5 text-green-400 flex-shrink-0">✓</div>
                  <p className="text-green-200 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                <h2 className="text-lg sm:text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Mark Manson Style
                </h2>
                <div
                  className="w-full h-64 sm:h-80 bg-black/40 border border-pink-500/30 rounded-xl p-4 overflow-y-auto text-pink-100 font-mono text-sm"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(236, 72, 153, 0.5) transparent'
                  }}
                >
                  {transformedText || (
                    <span className="text-pink-400/40">
                      Your transformed text will appear here...
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={downloadTransformed}
                    disabled={!transformedText}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={!transformedText}
                    className="flex-1 bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-50 disabled:cursor-not-allowed text-purple-100 font-bold py-3 px-6 rounded-lg transition-all border border-purple-500/40 hover:border-purple-500/60 text-sm sm:text-base"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <p className="text-xs text-purple-300 font-bold mb-2">💡 Pro Tips:</p>
                <ul className="text-xs text-purple-200/70 space-y-1">
                  <li>• Start with 2-3 page excerpts</li>
                  <li>• Longer input = better results</li>
                  <li>• Works offline once loaded</li>
                  <li>• Add to home screen on Android</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        textarea::-webkit-scrollbar {
          width: 8px;
        }
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.4);
          border-radius: 4px;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.6);
        }
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.4);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.6);
        }
      `}</style>
    </div>
  );
};

export default StyleTransformer;
