/**
 * Yellove OS - Main Application Component
 * Handles high-level orchestration of stadium matrix telemetries.
 */
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import DOMPurify from 'dompurify';

// Yellove OS Core
import { useFirebaseData, useAuth, useMapLogic, useStadiumSimulation } from '../core/hooks';
import { STADIUM_LOCATIONS, ANNOUNCEMENTS } from '../core/config/constants';
import { calculateSmartDecisions } from '../core/utils';
import { analytics, googleAI, logAnalyticsEvent } from '../services';

// Components
import QueueCard from '../app-system/QueueCard';
import TimeDisplay from './TimeDisplay';

// Lazy loaded modules
const GoogleStadiumMap = React.lazy(() => import('../app-system/GoogleStadiumMap'));
const CaptainAI = React.lazy(() => import('../app-system/CaptainAI'));
const SmartReturnPanel = React.lazy(() => import('../app-system/SmartReturnPanel'));
const NavigationPanel = React.lazy(() => import('./NavigationPanel'));
const LoginScreen = React.lazy(() => import('./LoginScreen'));
const StadiumMap = React.lazy(() => import('../app-system/StadiumMap'));
const OfflineScreen = React.lazy(() => import('./OfflineScreen'));

// Fallback spinner for lazy loading
const FallbackSpinner = () => (
    <div className="w-full h-full flex items-center justify-center min-h-[250px] bg-gray-900 border border-white/5 rounded-xl">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-csk-gold border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
            <span className="text-gray-400 text-xs mt-3 font-semibold">Loading Module...</span>
        </div>
    </div>
);

const MAP_LIBRARIES = ['places', 'geometry'];

export default function App() {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: MAP_LIBRARIES,
    });
    
    // Auth & Identity State
    const { user, login, register, logout } = useAuth();
    
    // UI & System State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [matchMode, setMatchMode] = useState(false);
    const [announcementIdx, setAnnouncementIdx] = useState(0);
    const [alert, setAlert] = useState(null);
    const [showSmartReturn, setShowSmartReturn] = useState(false);
    const [showNavigation, setShowNavigation] = useState(false);
    const [externalDirections, setExternalDirections] = useState(null);
    const [isThinking, setIsThinking] = useState(false);

    // Network Status Monitoring
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Real-time Data Synchronization
    const { data: sections, setData: setSections } = useFirebaseData('crowdDensity');
    const { data: amenities } = useFirebaseData('queueTimes');
    const { data: transports } = useFirebaseData('transportAvailability');

    // Strategic Navigation Hook
    const { 
        origin, destination, waypoints, routeColor, markers,
        clearRoutes, drawRoute, calculateAddressRoute, fetchTransitOptions 
    } = useMapLogic();

    const [chatLog, setChatLog] = useState([
        { sender: 'ai', text: "Process is more important than the result. I have analyzed the stadium matrix. What's your next move?" }
    ]);
    const [localTransports, setLocalTransports] = useState([]);
    const [friends, setFriends] = useState([
        { id: 1, name: 'Rahul M.', loc: 'Stand C Concourse', dist: '120m', status: 'Moving' },
        { id: 2, name: 'Priya K.', loc: 'Gate 2 Entrance', dist: '45m', status: 'Stationary' }
    ]);

    // Active Stadium Simulation
    useStadiumSimulation(matchMode, setSections, setAlert, setFriends);

    // Marquee Rotation Logic
    useEffect(() => {
        const announcementTimer = setInterval(() => {
            setAnnouncementIdx(prevIdx => (prevIdx + 1) % ANNOUNCEMENTS.length);
        }, 8000);
        return () => clearInterval(announcementTimer);
    }, []);

    // Performance Optimization: Derived Data
    const sortedAmenities = useMemo(() => {
        return (amenities || []).slice().sort((a,b) => a.wait - b.wait);
    }, [amenities]);

    const smartDecisions = useMemo(() => {
        return calculateSmartDecisions(sections, amenities, transports);
    }, [sections, amenities, transports]);

    // Adaptive Transport Telemetry
    useEffect(() => {
        if (isLoaded && typeof fetchTransitOptions === 'function') {
            fetchTransitOptions().then(fetched => {
                if (fetched?.length) setLocalTransports(fetched);
            }).catch(() => console.warn("Transport fetch deferred"));
        }
    }, [isLoaded, fetchTransitOptions]);

    // Dynamic Routing: Re-calculate if density spikes
    useEffect(() => {
        if (origin && routeColor === '#10B981') {
            drawRoute(STADIUM_LOCATIONS.FOOD, 'food');
        }
    }, [sections, origin, routeColor, drawRoute]);

    /**
     * Strategic Address Resolution
     */
    const handleAddressSelection = useCallback(async (addressQuery, silent = false) => {
        const cleanAddress = DOMPurify.sanitize(addressQuery.replace(/[<>]/g, "").trim()).substring(0, 200);
        if (cleanAddress.length < 3 || !isLoaded) return false;
        
        setShowSmartReturn(false);
        setExternalDirections(null);
        if (!silent) setChatLog(prev => [...prev, { sender: 'user', text: `Route me strictly to ${cleanAddress}` }]);

        try {
            const routingResult = await calculateAddressRoute(cleanAddress);
            if (routingResult?.success) {
                if (!silent) {
                    setTimeout(() => {
                        setChatLog(prev => [...prev, { sender: 'ai', text: `Geocoded ${addressQuery}. Path optimized. Follow the tactical recommendation.` }]);
                    }, 800);
                }
                return true;
            }
            throw new Error("Geocoding failed");
        } catch {
            setChatLog(prev => [...prev, { sender: 'ai', text: `I couldn't pinpoint "${addressQuery}" exactly.` }]);
            return false;
        }
    }, [calculateAddressRoute, isLoaded]);

    /**
     * AI Orchestration: Intelligent Query Handling
     */
    const handleAskAssistant = useCallback(async (userQuery) => {
        const cleanUserQuery = DOMPurify.sanitize(userQuery.replace(/[<>]/g, "").trim()).substring(0, 500);
        if (!cleanUserQuery || cleanUserQuery.length < 2) return;

        setChatLog(prev => [...prev, { sender: 'user', text: cleanUserQuery }]);
        if (!isLoaded) {
            setChatLog(prev => [...prev, { sender: 'ai', text: "Systems initializing..." }]);
            return;
        }

        setIsThinking(true);
        const lowerQuery = cleanUserQuery.toLowerCase();

        // High-Priority Tactical Triggers
        if (lowerQuery.includes("food") || lowerQuery.includes("eat")) {
            await drawRoute(STADIUM_LOCATIONS.FOOD, 'food');
            setChatLog(prev => [...prev, { sender: 'ai', text: `Nearest food stall is ${STADIUM_LOCATIONS.FOOD.name}. Tactical route mapped to avoid concourse congestion. 💛` }]);
            setIsThinking(false);
            return;
        } else if (lowerQuery.includes("emergency") || lowerQuery.includes("exit") || lowerQuery.includes("help")) {
            await drawRoute(STADIUM_LOCATIONS.GATES[0], 'emergency');
            setChatLog(prev => [...prev, { sender: 'ai', text: `Nearest emergency exit is ${STADIUM_LOCATIONS.GATES[0].name}. Follow the red tactical path immediately for extraction. 💛` }]);
            setIsThinking(false);
            return;
        } else if (lowerQuery.includes("transport") || lowerQuery.includes("home") || lowerQuery.includes("metro")) {
            setShowSmartReturn(true);
            setChatLog(prev => [...prev, { sender: 'ai', text: `Transport options are now available in the Smart Return panel. Optimized extraction modes identified for you. 💛` }]);
            setIsThinking(false);
            return;
        } else if (lowerQuery.includes("to") || lowerQuery.includes("reach") || lowerQuery.includes("way")) {
            const target = cleanUserQuery.replace(/to reach|reach|faster|way|go to|route to/gi, '').trim();
            if (target.length > 2) handleAddressSelection(target, true);
        } else if (lowerQuery.includes("entry") || lowerQuery.includes("gate")) {
            const g3 = sections?.find(s => s.id === 'gate-3')?.count || 50;
            const g5 = sections?.find(s => s.id === 'gate-5')?.count || 50;
            const optimal = g3 < g5 ? STADIUM_LOCATIONS.GATES[0] : STADIUM_LOCATIONS.GATES[1];
            await drawRoute(optimal, 'general');
            
            const gateName = optimal.id === 'gate-3' ? 'Gate 3 (North)' : 'Gate 5 (South)';
            setChatLog(prev => [...prev, { sender: 'ai', text: `Clearest entry is ${gateName}. Density analysis complete, path optimized for speed. 💛` }]);
            setIsThinking(false);
            return;
        }

        try {
            const response = await googleAI.processQuery(cleanUserQuery, {
                crowds: sections, queues: amenities, transport: localTransports,
                chatHistory: chatLog
            });
            setChatLog(prev => [...prev, { sender: 'ai', text: response }]);
            logAnalyticsEvent('gemini_assistant_query', { query: lowerQuery });
        } catch {
            setChatLog(prev => [...prev, { sender: 'ai', text: "Telemetry link unstable." }]);
        } finally {
            setIsThinking(false);
        }
    }, [sections, amenities, localTransports, chatLog, drawRoute, isLoaded, handleAddressSelection]);
    
    /**
     * Quick System Interventions
     */
    const handleQuickAction = useCallback(async (actionType) => {
        if (!isLoaded) return;
        try {
            switch (actionType) {
                case 'emergency':
                    setChatLog(prev => [...prev, { sender: 'user', text: "Emergency exit required!" }]);
                    await drawRoute(STADIUM_LOCATIONS.GATES[0], 'emergency');
                    break;
                case 'entry': {
                    const g3 = sections?.find(s => s.id === 'gate-3')?.count || 50;
                    const g5 = sections?.find(s => s.id === 'gate-5')?.count || 50;
                    const optimal = g3 < g5 ? STADIUM_LOCATIONS.GATES[0] : STADIUM_LOCATIONS.GATES[1];
                    setChatLog(prev => [...prev, { sender: 'user', text: "Find clearest entry gate." }]);
                    await drawRoute(optimal, 'general');
                    break;
                }
                case 'food':
                    setChatLog(prev => [...prev, { sender: 'user', text: "Fastest food stall." }]);
                    await drawRoute(STADIUM_LOCATIONS.FOOD, 'food');
                    break;
                case 'transport':
                    setChatLog(prev => [...prev, { sender: 'user', text: "Transport options." }]);
                    setShowSmartReturn(true);
                    break;
                default: break;
            }
        } catch (err) {
            setAlert("System telemetry delay.");
        }
    }, [isLoaded, drawRoute, sections]);

    /**
     * Multi-Modal Extraction
     */
    const handleTransportSelect = useCallback((transport) => {
        const isTrain = transport?.id === 'train' || transport?.type?.toLowerCase().includes('train');
        setShowSmartReturn(false);
        setExternalDirections(null);

        const finalTarget = isTrain && destination ? { ...destination } : {
            lat: typeof transport.lat === 'function' ? transport.lat() : transport.lat,
            lng: typeof transport.lng === 'function' ? transport.lng() : transport.lng,
            name: transport.station || transport.type
        };

        const routingMode = isTrain ? 'Local Train' : transport.type;
        const transitOptions = isTrain ? { modes: ['RAIL'] } : null;
        const originOverride = isTrain ? { lat: 13.0645, lng: 80.2810 } : null;

        drawRoute(finalTarget, 'transport', routingMode, transitOptions, originOverride);
        logAnalyticsEvent('transport_selected', { type: routingMode });
        setChatLog(prev => [...prev, { sender: 'ai', text: `Routing to ${finalTarget.name} via ${routingMode}.` }]);
        if (transport.url) window.open(transport.url, '_blank', 'noreferrer');
    }, [drawRoute, destination]);

    const handleNavigationRequest = useCallback(({ origin, destination, result, googleMode, travelMode, transitOptions }) => {
        setExternalDirections(result);
        drawRoute({ lat: destination.lat(), lng: destination.lng(), name: "Route Destination" }, 'address', travelMode || googleMode || 'DRIVING', transitOptions, origin);
    }, [drawRoute]);

    if (!isOnline) return <Suspense fallback={<FallbackSpinner />}><OfflineScreen /></Suspense>;
    if (!user) return <Suspense fallback={<FallbackSpinner />}><LoginScreen login={login} register={register} /></Suspense>;

    return (
        <div className={`min-h-screen pb-12 transition-colors duration-1000 ${matchMode ? 'bg-[#05080f]' : 'bg-[#111827]'}`}>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3 focus:bg-csk-gold focus:text-black focus:absolute focus:z-50 focus:top-0 focus:left-0 font-bold">Skip to main content</a>
            
            <nav className="sticky top-0 z-50 bg-gray-900/70 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-3.5" aria-label="Global System Navigation">
                <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-csk-gold to-yellow-600 flex items-center justify-center shadow-lg border border-yellow-300/50" aria-hidden="true">
                            <i className="fas fa-chart-pie text-black text-xl"></i>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-black text-white tracking-tight leading-none mb-0.5">Yellove<span className="text-csk-gold">OS</span></h1>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" aria-hidden="true"></span> App Sync Active
                                <span className="mx-3 opacity-20">|</span>
                                <TimeDisplay />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setShowNavigation(true)} className="flex items-center gap-2 px-3 md:px-5 py-2 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-wider transition-all duration-300 border bg-indigo-600/20 text-indigo-100 border-indigo-500/50 hover:bg-indigo-600/40">
                            <i className="fas fa-route"></i> <span className="hidden sm:inline">Navigation</span>
                        </button>
                        <button type="button" onClick={() => setMatchMode(m => !m)} className={`relative flex items-center gap-2 px-3 md:px-5 py-2 rounded-full font-bold text-[10px] md:text-[11px] uppercase tracking-wider transition-all duration-300 border ${matchMode ? 'bg-red-500/10 text-red-100 border-red-500 match-mode-glow' : 'bg-gray-800/50 text-gray-400 border-gray-700'}`}>
                            <i className={`fas fa-fire-alt ${matchMode ? 'text-red-500 animate-pulse' : ''}`}></i>
                            <span className="hidden sm:inline">Match Mode</span>
                        </button>
                        <button type="button" onClick={logout} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider transition-all border bg-gray-800/50 text-gray-400 border-gray-700 hover:text-white">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </nav>

            <main id="main-content" className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                <section aria-label="Tactical Announcements" className="mb-6">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800/20 rounded-lg p-3 py-2.5 border border-white/5 flex items-center gap-4 shadow-sm overflow-hidden">
                        <div className="bg-csk-gold text-black text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shrink-0" aria-hidden="true">
                            <span className="w-1 h-1 rounded-full bg-black animate-ping-slow"></span> Broadcast
                        </div>
                        <div className="text-sm font-medium text-gray-200 truncate w-full h-5 relative" aria-live="polite">
                            <span className="absolute inset-0 animate-fade-in-out font-mono tracking-tight">{ANNOUNCEMENTS[announcementIdx]}</span>
                        </div>
                    </div>
                </section>

                <section aria-label="Smart Tactical Decisions" className="mb-6 glass-panel p-5 border border-indigo-500/30">
                    <div className="flex justify-between items-center mb-4 border-b border-indigo-500/20 pb-2">
                        <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest flex items-center gap-2">
                            <i className="fas fa-brain text-indigo-400"></i> Smart Decision Engine
                        </div>
                        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter animate-pulse">
                            Best Decisions Engine Active
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Best Entry', value: smartDecisions?.entryGate?.name || "Gate 3", icon: 'fa-sign-in-alt', color: 'text-emerald-400', reason: smartDecisions.entryReason, action: () => drawRoute(smartDecisions.entryGate, 'general') },
                            { label: 'Best Exit', value: smartDecisions?.exitGate?.name || "Gate 5", icon: 'fa-door-open', color: 'text-amber-400', reason: smartDecisions.exitReason, action: () => drawRoute(smartDecisions.exitGate, 'general') },
                            { label: 'Best Food', value: smartDecisions?.bestFood?.name || "Quick Bites", icon: 'fa-hamburger', color: 'text-orange-400', reason: smartDecisions.foodReason, action: () => drawRoute(STADIUM_LOCATIONS.FOOD, 'food') },
                            { label: 'Best Transport', value: smartDecisions.bestTransport, icon: 'fa-subway', color: 'text-blue-400', reason: smartDecisions.transportReason, action: () => handleAskAssistant("transport") },
                            { label: 'Precision Route', value: 'Start Nav', icon: 'fa-route', color: 'text-csk-gold', reason: 'Custom point-to-point routing.', action: () => setShowNavigation(true) }
                        ].map((d, i) => (
                            <button key={i} type="button" onClick={() => { d.action(); window.scrollTo({top: 500, behavior: 'smooth'}); }} className="p-4 bg-indigo-900/20 rounded-xl hover:bg-indigo-900/40 transition-all text-left border border-indigo-500/10 group">
                                <div className="text-[10px] text-indigo-300 font-bold mb-1.5 flex items-center gap-2">
                                    <i className={`fas ${d.icon} ${d.color} bg-white/5 p-1.5 rounded-lg`}></i> {d.label}
                                </div>
                                <div className="text-sm font-black text-white group-hover:text-csk-gold transition-colors">{d.value}</div>
                                <div className="text-[10px] text-gray-500 mt-2 p-2 bg-black/40 rounded border border-white/5 italic">💡 {d.reason}</div>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <section aria-label="Stadium Matrix View" className={`glass-panel p-5 transition-all duration-700 ${matchMode ? 'match-mode-glow' : ''}`}>
                            <div className="flex justify-between items-end mb-5">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <i className="fas fa-map-location-dot text-csk-gold"></i> System Topography
                                    </h2>
                                    <p className="text-gray-400 text-xs mt-1 font-medium">Real-time crowd distribution mapped onto Chepauk</p>
                                </div>
                                <button type="button" onClick={clearRoutes} className="text-[10px] font-bold uppercase text-gray-300 bg-gray-800 hover:bg-gray-700 p-2 md:px-3 rounded-lg border border-white/10 transition-colors">
                                    Clear Map
                                </button>
                            </div>
                            <div className="relative w-full h-[350px] rounded-xl overflow-hidden border border-white/5 bg-gray-900">
                                <Suspense fallback={<FallbackSpinner />}>
                                    {origin && destination ? (
                                        <GoogleStadiumMap isLoaded={isLoaded} origin={origin} destination={destination} waypoints={waypoints} routeColor={routeColor} markers={markers} externalDirections={externalDirections} matchMode={matchMode} />
                                    ) : (
                                        <StadiumMap sections={sections} matchMode={matchMode} />
                                    )}
                                </Suspense>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section aria-label="Queue Telemetry" className="glass-panel p-5 flex flex-col h-[400px]">
                                <h2 className="text-base font-bold mb-4 text-white flex items-center gap-2">
                                    <i className="fas fa-hourglass-half text-csk-gold"></i> Queue Telemetry
                                </h2>
                                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                    {sortedAmenities.map(a => <QueueCard key={a.id} item={a} />)}
                                </div>
                            </section>
                            <section aria-label="Squad Radar" className="glass-panel p-5 h-[400px] flex flex-col">
                                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                                    <i className="fas fa-users-viewfinder text-csk-gold"></i> Squad Radar
                                </h2>
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar pb-4">
                                    {friends.map(f => (
                                        <div key={f.id} className="p-3 bg-gray-900/60 rounded-xl border border-white/5 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-700/50 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-300">{f.name.charAt(0)}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-200">{f.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase">{f.loc}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-emerald-400 text-sm">{f.dist}</div>
                                                <div className="text-[9px] uppercase tracking-wider text-gray-500 mt-0.5">{f.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="w-full py-2.5 mt-2 bg-white/5 border border-dashed border-white/20 rounded-xl text-gray-400 text-[10px] font-black uppercase tracking-widest hover:border-csk-gold/50 hover:text-csk-gold transition-all">
                                    Ping My Location
                                </button>
                            </section>
                        </div>
                    </div>

                    <aside aria-label="Assistant and Momentum Intelligence" className="lg:col-span-1 space-y-6 flex flex-col">
                        <div className="flex-1 min-h-[500px] border border-white/5 rounded-2xl bg-[#0a0f18] overflow-hidden flex flex-col shadow-2xl relative">
                            <Suspense fallback={<FallbackSpinner />}><CaptainAI chatLog={chatLog} onAsk={handleAskAssistant} onAction={handleQuickAction} isThinking={isThinking} /></Suspense>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-12 py-10 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-csk-gold">System Architecture Logic</div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {['Google Directions', 'Google Places', 'Geocoding API', 'Firebase RTDB'].map((t, index) => (
                                <div key={index} className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-700" aria-hidden="true"></div> {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            {alert && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg animate-bounce" role="alert">
                    <div className="p-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center gap-4">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span className="flex-1 font-bold text-sm">{alert}</span>
                        <button onClick={() => setAlert(null)}><i className="fas fa-times"></i></button>
                    </div>
                </div>
            )}

            {showSmartReturn && (
                <Suspense fallback={null}>
                    <SmartReturnPanel 
                        isLoaded={isLoaded} 
                        transports={localTransports.length > 0 ? localTransports : transports} 
                        onClose={() => setShowSmartReturn(false)} 
                        onSelect={handleTransportSelect} 
                        onSelectAddress={handleAddressSelection} 
                    />
                </Suspense>
            )}

            {showNavigation && (
                <Suspense fallback={<FallbackSpinner />}>
                    <NavigationPanel 
                        isLoaded={isLoaded} 
                        onClose={() => setShowNavigation(false)} 
                        onRouteRequest={handleNavigationRequest} 
                    />
                </Suspense>
            )}
        </div>
    );
}
