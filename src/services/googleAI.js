import { GoogleGenerativeAI } from "@google/generative-ai";
import DOMPurify from 'dompurify';
/* global process */

/**
 * Gemini Service - Intelligent Orchestration Layer for SmartStadium.
 * Dual-Mode: Authentic API Integration with Tactical Simulation Fallback.
 */

const getAPIKey = () => {
    // Auto-Detect Strategy: Check for dedicated Gemini key, then fallback to unified Maps key
    const gKey = import.meta.env?.VITE_GEMINI_API_KEY;
    const mKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
    
    // Process shim for test runners
    const pGKey = typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : "";
    const pMKey = typeof process !== 'undefined' ? process.env?.VITE_GOOGLE_MAPS_API_KEY : "";
    
    const key = (gKey || pGKey || mKey || pMKey || "");
    return (String(key)).trim();
};
const isKeyValid = (key) => key && key !== 'undefined' && key !== '' && key !== 'ADD_YOUR_GEMINI_KEY_HERE';

/**
 * // Integrated Gemini Intelligence (Real + Simulated Fallback)
 * Handles tactical reasoning for stadium interventions.
 */

export const googleAI = {
    /**
     * Specialized reasoning engine for fan queries
     * @param {string} query User input
     * @param {Object} context { crowds, queues, transport, chatHistory }
     * @returns {Promise<string>} AI response
     */
    processQuery: async (query, context) => {
        // Security Check: Input Validation & Sanitization
        const filteredQuery = String(query || '').replace(/[<>]/g, "").replace(/quantum/gi, "[REDACTED]").replace(/protocol/gi, "strategy");
        const cleanQuery = DOMPurify.sanitize(filteredQuery.trim()).substring(0, 500);
        
        if (!cleanQuery || cleanQuery.length < 2) {
            return "I'm ready to help, but I need a clear question. Whistle Podu! 💛";
        }

        const lowerQuery = cleanQuery.toLowerCase();
        const { crowds, queues, transport, chatHistory } = context;
        const apiKey = getAPIKey();

        let lastError = null;

        // MODE 1: Discovery & Direct Logic Vault (Self-Healing)
        if (isKeyValid(apiKey)) {
            try {
                // 1. Discovery Phase: See what this key is ACTUALLY allowed to use
                const discoveryUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                let availableModels = [];
                try {
                    const dRes = await fetch(discoveryUrl);
                    const dData = await dRes.json();
                    availableModels = dData.models?.map(m => m.name.replace('models/', '')) || [];
                    console.log("Captain AI - Discovery Results:", availableModels);
                } catch (e) {
                    console.warn("Discovery failed, using defaults.");
                }

                // 2. Intelligence Phase: Strategic Selection (Prioritizing Gemini 3 Flash)
                const modelToUse = availableModels.includes('gemini-3-flash') ? 'gemini-3-flash' :
                                   availableModels.includes('gemini-1.5-flash-latest') ? 'gemini-1.5-flash-latest' :
                                   availableModels.includes('gemini-1.5-flash') ? 'gemini-1.5-flash' : 
                                   availableModels.includes('gemini-pro') ? 'gemini-pro' : 
                                   availableModels[0] || 'gemini-3-flash'; // User-preferred fallback

                const unifiedPrompt = `SYSTEM: You are "Captain Yellove", the tactical AI for CSK. 
Brevity: <40 words. Tone: Strategic, Yellow. 💛
CONVERSATION:\n${(chatHistory || []).slice(-4).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}\nUSER: ${cleanQuery}`;

                const payload = {
                    contents: [{ parts: [{ text: unifiedPrompt }] }]
                };

                const endpoints = [
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
                    `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent?key=${apiKey}`
                ];

                for (const url of endpoints) {
                    try {
                        const res = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        const data = await res.json();
                        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                            return data.candidates[0].content.parts[0].text.trim();
                        } else if (data.error) {
                            lastError = data.error.message;
                        }
                    } catch (e) {
                        lastError = e.message;
                    }
                }
            } catch (err) {
                console.error("Gemini Discovery failure:", err);
                lastError = err.message || "Unknown API Error";
            }
        }

        // MODE 2: Tactical Simulation Fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Final Response with Debugging Help for User
        const errorHint = lastError ? ` (System Note: ${lastError.substring(0, 50)})` : "";
        
        if (lowerQuery.includes("achievement") || lowerQuery.includes("record") || lowerQuery.includes("stat") || lowerQuery.includes("history")) {
            return `[SIMULATED] Legendary records are built on the Process. From IPL trophies to finishing masterclasses, we celebrate every strategic milestone at Chepauk! 💛${errorHint}`;
        }

        const getBestTransitMode = () => {
            const modes = [
                { type: 'Metro', speed: 8, cost: 5, availability: 9, emoji: '🚇' },
                { type: 'Cab', speed: 9, cost: 9, availability: 4, emoji: '🚖' },
                { type: 'Bus', speed: 4, cost: 2, availability: 8, emoji: '🚌' },
                { type: 'Train', speed: 7, cost: 1, availability: 8, emoji: '🚆' }
            ];

            if (lowerQuery.includes("cheap") || lowerQuery.includes("less cost") || lowerQuery.includes("money")) {
                return modes.reduce((a, b) => a.cost < b.cost ? a : b);
            }
            if (lowerQuery.includes("fast") || lowerQuery.includes("quick") || lowerQuery.includes("soon")) {
                return modes.reduce((a, b) => a.speed > b.speed ? a : b);
            }
            if (lowerQuery.includes("convenient") || lowerQuery.includes("easy") || lowerQuery.includes("available")) {
                return modes.reduce((a, b) => (a.availability + a.speed) > (b.availability + b.speed) ? a : b);
            }
            // Default to Metro as the most balanced SmartStadium choice
            return modes[0];
        };

        const recommended = getBestTransitMode();

        if (lowerQuery.includes("route") || lowerQuery.includes("to") || lowerQuery.includes("reach") || lowerQuery.includes("way")) {
            const extractionLocation = cleanQuery.replace(/reach/i, '').replace(/to/i, '').trim() || "your destination";
            
            let reasoning = "";
            if (recommended.type === 'Metro') reasoning = "It's the most convenient balance of speed and availability right now.";
            if (recommended.type === 'Cab') reasoning = "It's the fastest way out, though costs are currently peaking.";
            if (recommended.type === 'Train') reasoning = "It's the most cost-effective solution for long-distance extraction.";
            if (recommended.type === 'Bus') reasoning = "It's a high-availability option if you prefer to avoid the station crowds.";

            return `[SIMULATED] Captain Yellove Strategic analysis for ${extractionLocation} complete. I recommend ${recommended.emoji} ${recommended.type}. ${reasoning} Proceed to the designated hub for extraction. 💛${errorHint}`;
        }

        if (lowerQuery.includes("crowd") || lowerQuery.includes("busy") || lowerQuery.includes("gate")) {
            const gate3Count = crowds?.find(section => section.id === 'gate-3')?.count || 50;
            const gate5Count = crowds?.find(section => section.id === 'gate-5')?.count || 50;
            const betterGate = gate3Count < gate5Count ? "Gate 3" : "Gate 5";
            return `[SIMULATED] Captain Yellove Tactical analysis shows ${betterGate} is currently less congested. Recommended for high-speed extraction. Whistle Podu! 💛${errorHint}`;
        }

        if (lowerQuery.includes("dhoni") || lowerQuery.includes("thala")) {
            return `[SIMULATED] Thala MS Dhoni is the soul of the Super Kings. His tactical mastery behind the stumps and finishing prowess are unmatched. Whistle Podu! 💛${errorHint}`;
        }

        if (lowerQuery.includes("king") || lowerQuery.includes("kohli")) {
            return `[SIMULATED] Cricket has many kings, but at Chepauk, the Yellove fans rule. Whether it's Virat or MSD, we respect the legends of the game. 💛${errorHint}`;
        }

        if (lowerQuery.includes("ipl") || lowerQuery.includes("cricket") || lowerQuery.includes("match") || lowerQuery.includes("csk")) {
            return `[SIMULATED] The IPL is where strategies meet pulse-pounding action. As Captain Yellove, I'm here to ensure your stadium experience is top-tier. 💛${errorHint}`;
        }

        if (lowerQuery.includes("score") || lowerQuery.includes("wicket") || lowerQuery.includes("run") || lowerQuery.includes("six") || lowerQuery.includes("four")) {
            return `[SIMULATED] Every run and wicket changes the stadium momentum. Stay tuned to the big screen while I manage your tactical routing! 💛${errorHint}`;
        }

        return `[SIMULATED] Captain Yellove Strategic Assistant online. Most convenient mode right now: ${recommended.type}. How can I guide your Yellove experience? 💛${errorHint}`;
    }
};
