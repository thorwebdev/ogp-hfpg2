
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { generateWatercolourPainting, editWatercolourPainting } from './geminiService';

const SUGGESTIONS = [
    "The Eiffel Tower at sunset",
    "A snowy street in Kyoto",
    "Santorini's blue domes",
    "Grand Canyon during golden hour",
    "A cozy cottage in the English Cotswolds",
    "Mount Fuji mirrored in a lake"
];

const App: React.FC = () => {
    const [place, setPlace] = useState<string>('');
    const [editPrompt, setEditPrompt] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [watercolourPainting, setWatercolourPainting] = useState<string>('');
    const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSuggestionIndex((prev) => (prev + 1) % SUGGESTIONS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const targetPlace = place.trim();
        if (!targetPlace) {
            setError("Please enter a place or description.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setWatercolourPainting('');
        setEditPrompt('');

        try {
            const paintingDataUrl = await generateWatercolourPainting(targetPlace);
            setWatercolourPainting(paintingDataUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate watercolor painting.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPrompt.trim() || !watercolourPainting) return;

        setIsEditing(true);
        setError(null);

        try {
            const refinedPainting = await editWatercolourPainting(watercolourPainting, editPrompt, place);
            setWatercolourPainting(refinedPainting);
            setEditPrompt('');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to refine the painting.");
        } finally {
            setIsEditing(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPlace(suggestion);
        setTimeout(() => {
            const btn = document.getElementById('generate-btn');
            btn?.click();
        }, 10);
    };

    const handleDownload = () => {
        if (!watercolourPainting) return;
        const link = document.createElement('a');
        link.href = watercolourPainting;
        const safeName = place.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `watercolor_${safeName || 'painting'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#fdfcf8] text-[#2c2c2c] font-serif">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <header className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Paint Any Place
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto italic">
                        Type the name of a place you love, and let Gemini's brushes bring it to life in a stunning watercolor style.
                    </p>
                </header>

                <main className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-10">
                        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={place}
                                    onChange={(e) => setPlace(e.target.value)}
                                    placeholder={`Try "${SUGGESTIONS[currentSuggestionIndex]}"...`}
                                    className="w-full px-6 py-4 text-lg bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:italic placeholder:text-gray-400"
                                    disabled={isLoading || isEditing}
                                />
                            </div>
                            <button
                                id="generate-btn"
                                type="submit"
                                disabled={isLoading || isEditing || !place.trim()}
                                className="px-8 py-4 bg-[#2c2c2c] text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 min-w-[180px]"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Painting...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">🎨</span> Paint
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2 mb-10">
                            <span className="text-sm font-semibold text-gray-400 mr-2 uppercase tracking-wider">Suggestions:</span>
                            {SUGGESTIONS.map((s, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isLoading || isEditing}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-50"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center">
                                {error}
                            </div>
                        )}

                        <div className="relative aspect-[4/3] md:aspect-[16/9] bg-gray-50 rounded-3xl overflow-hidden border-4 border-white shadow-inner flex items-center justify-center mb-8">
                            {watercolourPainting ? (
                                <div className="group w-full h-full relative">
                                    <img
                                        src={watercolourPainting}
                                        alt={place}
                                        className="w-full h-full object-cover"
                                    />
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <p className="font-bold text-gray-700">Refining your masterpiece...</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={handleDownload}
                                            className="p-3 bg-white/90 text-black rounded-full shadow-lg hover:bg-white transition-colors flex items-center gap-2"
                                            title="Download Masterpiece"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div className="text-center p-8 animate-pulse">
                                    <div className="text-6xl mb-4">🎨</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Mixing the paints...</h3>
                                    <p className="text-gray-500 italic">Preparing a custom palette for "{place}"</p>
                                </div>
                            ) : (
                                <div className="text-center p-8 opacity-40">
                                    <div className="text-8xl mb-6">🖌️</div>
                                    <h3 className="text-xl text-gray-400 italic">Your canvas awaits a location</h3>
                                </div>
                            )}
                        </div>

                        {watercolourPainting && !isLoading && (
                            <div className="border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🪄</span> Refine your painting
                                </h3>
                                <form onSubmit={handleEdit} className="flex flex-col md:flex-row gap-4">
                                    <input
                                        type="text"
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder="E.g., 'Add a double rainbow', 'Make it winter', 'Add a small boat'..."
                                        disabled={isEditing}
                                        className="flex-grow px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-300 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isEditing || !editPrompt.trim()}
                                        className="px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all active:scale-95 disabled:bg-gray-300 shadow-md flex items-center justify-center gap-2"
                                    >
                                        {isEditing ? 'Refining...' : 'Apply Refinement'}
                                    </button>
                                </form>
                                <p className="mt-3 text-sm text-gray-400 italic px-2">
                                    This uses the current image as a base to apply your specific instructions.
                                </p>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="mt-16 text-center space-y-4">
                    <p className="text-gray-400 italic">
                        "Every place has its own light, its own mood, and its own story to paint."
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            AI Studio Ready
                        </span>
                        <span className="w-px h-4 bg-gray-200"></span>
                        <p>Powered by Gemini 2.5 Flash</p>
                        <span className="w-px h-4 bg-gray-200"></span>
                        <a
                            href="https://x.com/leslienooteboom"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-500 transition-colors"
                        >
                            @leslienooteboom
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;
