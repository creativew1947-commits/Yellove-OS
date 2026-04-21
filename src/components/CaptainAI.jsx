import React, { useRef, useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';

const CaptainAI = ({ chatLog, onAsk, onAction, isThinking }) => {

    const endRef = useRef(null);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (endRef.current?.scrollIntoView) {
                endRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [chatLog, isThinking]);

    // Simple typing effect for AI messages
    const Typewriter = ({ text }) => {
        const [displayedText, setDisplayedText] = useState('');
        
        useEffect(() => {
            let i = 0;
            const timer = setInterval(() => {
                setDisplayedText(text.slice(0, i));
                i++;
                if (i > text.length) clearInterval(timer);
            }, 15);
            return () => clearInterval(timer);
        }, [text]);

        return <span>{displayedText}</span>;
    };

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        
        // Security: Remove < and > characters specifically, then sanitize
        const cleaned = inputValue.replace(/[<>]/g, "");
        const sanitizedData = DOMPurify.sanitize(cleaned.trim());
        
        // Basic input validation: prevent empty and check minimum length
        if (sanitizedData && sanitizedData.length >= 2) {
            onAsk(sanitizedData);
            setInputValue('');
        }
    }, [inputValue, onAsk]);

    return (
        <section className="flex flex-col h-full bg-black/40 rounded-xl overflow-hidden border border-white/5" aria-label="Captain mode AI Chat">
            <header className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-3 border-b border-csk-gold/20 flex items-center shadow-lg">
                <div className="relative mr-3" aria-hidden="true">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-csk-dark to-gray-800 border-2 border-csk-gold flex justify-center items-center shadow-[0_0_15px_rgba(249,205,5,0.3)]">
                        <i className="fas fa-crown text-csk-gold text-lg"></i>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1E293B]"></div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">Captain Mode</h3>
                    <div className="text-[10px] text-emerald-400 font-medium">Gemini Strategic Integration</div>
                </div>
            </header>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar" aria-live="polite">
                {chatLog.map((msg, i) => (
                    <div key={i} className={`flex max-w-[88%] animate-slide-up ${msg.sender === 'user' ? 'ml-auto justify-end' : ''}`}>
                        {msg.sender === 'ai' && <i className="fas fa-robot text-csk-gold text-xs mt-2 mr-2 opacity-70" aria-hidden="true"></i>}
                        <div className={`p-3 text-sm shadow-md ${msg.sender === 'ai' ? 'bg-gray-800 text-gray-200 rounded-2xl rounded-tl-sm border border-white/5' : 'bg-csk-gold/90 text-black font-medium rounded-2xl rounded-tr-sm border border-csk-gold'}`}>
                            {msg.sender === 'ai' ? <Typewriter text={msg.text} /> : msg.text}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex max-w-[88%] animate-pulse">
                         <i className="fas fa-magic text-indigo-400 text-xs mt-2 mr-2 opacity-70"></i>
                         <div className="p-3 text-[11px] bg-indigo-950/40 text-indigo-200 rounded-2xl rounded-tl-sm border border-indigo-500/20 italic">
                             Gemini is analyzing stadium telemetry...
                         </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <nav className="p-3 bg-gray-900/80 border-t border-white/5 grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAsk("Find food")} 
                  aria-label="Find fastest food route" 
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-[10px] font-bold text-gray-200 py-2 rounded-lg border border-white/10 transition-colors"
                >
                    <i className="fas fa-pizza-slice text-orange-400" aria-hidden="true"></i> Find Food
                </button>
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAsk("Find clearest entry gate")} 
                  aria-label="Find clearest entry gate" 
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-[10px] font-bold text-gray-200 py-2 rounded-lg border border-white/10 transition-colors"
                >
                    <i className="fas fa-sign-in-alt text-emerald-400" aria-hidden="true"></i> Clear Entry
                </button>
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAsk("Emergency exit required!")} 
                  aria-label="Find nearest emergency exit"
                  className="flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 disabled:opacity-50 text-[10px] font-bold text-red-200 py-2 rounded-lg border border-red-500/30 transition-colors"
                >
                    <i className="fas fa-fire-extinguisher text-red-500" aria-hidden="true"></i> Emergency Exit
                </button>
                <button 
                  type="button"
                  disabled={isThinking}
                  onClick={() => onAsk("Show return transport options")} 
                  aria-label="Find return transport options"
                  className="flex items-center justify-center gap-2 bg-indigo-900/40 hover:bg-indigo-900/60 disabled:opacity-50 text-[10px] font-bold text-indigo-200 py-2 rounded-lg border border-indigo-500/30 transition-colors"
                >
                    <i className="fas fa-subway text-indigo-400" aria-hidden="true"></i> Return Home
                </button>
            </nav>


            <form onSubmit={handleSubmit} className="p-3 bg-gray-950/80 border-t border-white/10 flex gap-2">
                <label htmlFor="ai-chat-input" className="sr-only">Ask Captain for routing or queues</label>
                <input 
                    id="ai-chat-input"
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isThinking}
                    placeholder="Ask Captain for routing or queues..." 
                    className="flex-1 bg-gray-800 border border-gray-700 focus:border-csk-gold focus:ring-1 focus:ring-csk-gold rounded-lg px-3 py-2 text-sm text-gray-200 outline-none transition-all placeholder:text-gray-500 disabled:opacity-50"
                />
                <button 
                    type="submit" 
                    aria-label="Send message to Captain AI"
                    disabled={isThinking || !inputValue.trim()}
                    className="bg-csk-gold hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 text-black px-4 py-2 rounded-lg font-bold shadow-[0_0_10px_rgba(249,205,5,0.4)] transition-all"
                >
                    <i className="fas fa-paper-plane" aria-hidden="true"></i>
                </button>
            </form>
        </section>
    );
};

export default React.memo(CaptainAI);
