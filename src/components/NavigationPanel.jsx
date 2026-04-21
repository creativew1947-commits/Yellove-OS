// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { drawRoute, getOptimalTransitRoute, getTransitConstants, initAutocomplete } from '../services';
import { computeDistance, TRANSPORT_MODES } from '../utils';

const NavigationPanel = ({ isLoaded, onClose, onRouteRequest, defaultOrigin = "Chepauk Stadium" }) => {
    const [originStr, setOriginStr] = useState(defaultOrigin);
    const [destStr, setDestStr] = useState('');
    const [travelMode, setTravelMode] = useState('cab');
    const [showDirections, setShowDirections] = useState(false);
    const [directionsSteps, setDirectionsSteps] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const [error, setError] = useState(null);
    
    const autocompleteOrigin = useRef(null);
    const autocompleteDest = useRef(null);

    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(() => {
            const originInput = document.getElementById('nav-origin');
            const destInput = document.getElementById('nav-destination');

            if (originInput && !autocompleteOrigin.current) {
                autocompleteOrigin.current = initAutocomplete(originInput, (place) => {
                    setOriginStr(place.formatted_address || place.name);
                });
            }

            if (destInput && !autocompleteDest.current) {
                autocompleteDest.current = initAutocomplete(destInput, (place) => {
                    setDestStr(place.formatted_address || place.name);
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isLoaded]);

    const modes = TRANSPORT_MODES;

    const [transitNarrative, setTransitNarrative] = useState(null);

    /**
     * Calculates route using the Cascading Mode Search strategy.
     * Centralized via NavigationService.
     */
    /**
     * Calculates route using the Cascaded Tactical Search strategy.
     * Decoupled via NavigationService.
     */
    const handleCalculateRoute = async () => {
        if (!originStr || !destStr) {
            setError("Please enter both origin and destination");
            return;
        }

        // Security: Input Sanitization
        const filteredOrigin = originStr.replace(/[<>]/g, "");
        const filteredDest = destStr.replace(/[<>]/g, "");
        const cleanOrigin = DOMPurify.sanitize(filteredOrigin.trim()).substring(0, 200);
        const cleanDest = DOMPurify.sanitize(filteredDest.trim()).substring(0, 200);
        
        if (cleanOrigin.length < 3 || cleanDest.length < 3) {
            setError("Address coordinates too vague.");
            return;
        }

        setError(null);
        setTransitNarrative(null);
        const modeCfg = modes.find(m => m.id === travelMode) || modes[0];
        const constants = getTransitConstants();

        try {
            let result;
            if (modeCfg.googleMode === 'TRANSIT') {
                result = await getOptimalTransitRoute(cleanOrigin, cleanDest, travelMode);
            } else {
                result = await drawRoute(null, cleanOrigin, cleanDest, null, modeCfg.googleMode);
            }

            if (!result.routes?.[0]) throw new Error("no_results");

            const routeLeg = result.routes[0].legs[0];
            const narrative = generateTransitNarrative(result.routes[0]);
            
            setTransitNarrative(narrative);
            setRouteInfo({
                distance: routeLeg.distance.text,
                duration: routeLeg.duration.text,
                startAddress: routeLeg.start_address,
                endAddress: routeLeg.end_address
            });
            setDirectionsSteps(routeLeg.steps);
            setShowDirections(true);
            
            const transitOptions = travelMode === 'cab' ? null : { 
                modes: travelMode === 'train' ? [constants.RAIL] : 
                       travelMode === 'metro' ? [constants.SUBWAY] : [constants.BUS] 
            };

            onRouteRequest({
                origin: routeLeg.start_location,
                destination: routeLeg.end_location,
                travelMode: travelMode,
                googleMode: modeCfg.googleMode,
                transitOptions,
                result: result
            });
        } catch (error) {
            console.error("Routing telemetry failure:", error);
            setError("Tactical route calculation failed. Telemetry sync error.");
        }
    };

    const generateTransitNarrative = (routeData) => {
        const route = routeData.legs[0];
        const transitSteps = route.steps.filter(s => s.travel_mode === 'TRANSIT');
        if (transitSteps.length === 0) return null;

        let narrative = "Yellove Tactics: ";
        
        // Add manual walking prefix if injected by the routing engine
        if (routeData.manualWalkPrefix) {
            narrative += routeData.manualWalkPrefix;
        }

        const firstStep = transitSteps[0];
        const stopName = firstStep.transit.departure_stop.name.toLowerCase();
        const lineName = (firstStep.transit.line.name || '').toLowerCase();
        
        // Context-aware station guidance for Chepauk area (if not already covered by manualWalkPrefix)
        if (!routeData.manualWalkPrefix && (originStr.toLowerCase().includes("chepauk") || originStr.toLowerCase().includes("stadium"))) {
            if (stopName.includes("government estate") || stopName.includes("lic") || stopName.includes("central metro")) {
                narrative += "Head to Government Estate Metro (Blue Line). ";
            } else if (stopName.includes("chepauk") || stopName.includes("beach") || lineName.includes("mrts") || lineName.includes("velachery")) {
                narrative += "Proceed to Chepauk Station for the MRTS / Local Train. ";
            }
        }

        narrative += `Board the ${firstStep.transit.line.name || firstStep.transit.line.short_name} towards ${firstStep.transit.arrival_stop.name}. `;
        
        if (transitSteps.length > 1) {
            for (let i = 1; i < transitSteps.length; i++) {
                const prev = transitSteps[i-1];
                const curr = transitSteps[i];
                narrative += `Switch at ${prev.transit.arrival_stop.name} to the ${curr.transit.line.name || curr.transit.line.short_name}. `;
            }
        } else {
            narrative += `Stay on the line until ${firstStep.transit.arrival_stop.name}. Avoid rush hours for a smoother transition. `;
        }
        
        return narrative;
    };

    const getTacticalAdvice = (step, prevStep) => {
        const isTransit = step.travel_mode === 'TRANSIT' && step.transit;
        const isWalking = step.travel_mode === 'WALKING';
        const distValue = step.distance.value;

        if (isTransit) {
            const vehicleType = step.transit.line.vehicle.type;
            const lineName = (step.transit.line.name || '').toLowerCase();
            const stopName = (step.transit.departure_stop.name || '').toLowerCase();
            const arrivalStop = (step.transit.arrival_stop.name || '').toLowerCase();

            // Tactical hub detection: Chennai MRTS and Suburban hubs
            const isRailHub = 
                stopName.includes('chepauk') || stopName.includes('beach') || stopName.includes('central') || 
                stopName.includes('egmore') || stopName.includes('park') || stopName.includes('fort') ||
                arrivalStop.includes('chepauk') || arrivalStop.includes('beach');

            // INTENT FIX: If user picked 'train' mode, treat all rail/subway/transit as Train details
            const isActuallyTrain = 
                travelMode === 'train' ||
                ['RAIL', 'HEAVY_RAIL', 'COMMUTER_TRAIN', 'SUBURBAN_RAIL'].includes(vehicleType) || 
                lineName.includes('mrts') || 
                lineName.includes('velachery') ||
                isRailHub;

            if (!isActuallyTrain && (vehicleType === 'SUBWAY' || vehicleType === 'METRO_RAIL')) {
                return {
                    title: "Metro Logistics",
                    advice: "Action: Get your Metro QR ticket via CMRL App to skip the counter. Proceed to the platform for the next train.",
                    icon: "fa-ticket"
                };
            }
            if (isActuallyTrain) {
                return {
                    title: "Rail Intel",
                    advice: "Action: Board the Local Train / MRTS. Use UTS App for instant paperless tickets. Local trains help bypass stadium road traffic.",
                    icon: "fa-train-subway"
                };
            }
            return {
                title: "Transit Transfer",
                advice: "Action: Keep change ready for the bus or use your transit card for a seamless transfer.",
                icon: "fa-bus"
            };
        }

        if (isWalking && distValue > 600) {
            return {
                title: "First-Mile Buffer",
                advice: "Logic: Significant walking distance (approx. 8-10 mins). You might prefer a quick Auto or Cab to the station/destination.",
                icon: "fa-person-walking-arrow-right"
            };
        }

        if (prevStep && prevStep.travel_mode === 'TRANSIT' && isWalking) {
           return {
                title: "Transfer Advice",
                advice: "Logic: You have reached the station. Switch modes now to reach your final target destination.",
                icon: "fa-shuffle"
           };
        }

        return null;
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-end md:p-6 p-0" role="dialog" aria-modal="true" aria-labelledby="nav-panel-title">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            <div className="relative w-full max-w-md h-full md:h-[90vh] bg-gray-900 border-l border-white/10 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gray-900 z-10">
                    <div>
                        <h2 id="nav-panel-title" className="text-xl font-black text-white flex items-center gap-2">
                             <i className="fas fa-directions text-csk-gold" aria-hidden="true"></i> Precision Routing
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Global Stadium Logistics</p>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation panel"
                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    >
                        <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-950/30">
                    {!showDirections ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="nav-origin" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Starting Point</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" aria-hidden="true">
                                            <i className="fas fa-circle text-[8px]"></i>
                                        </div>
                                        <input 
                                            id="nav-origin"
                                            type="text"
                                            value={originStr}
                                            onChange={(e) => setOriginStr(e.target.value)}
                                            placeholder="From location..."
                                            className="w-full bg-gray-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-csk-gold/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center -my-2 relative z-10">
                                    <button 
                                        type="button"
                                        aria-label="Swap origin and destination"
                                        onClick={() => {
                                            const temp = originStr;
                                            setOriginStr(destStr);
                                            setDestStr(temp);
                                        }}
                                        className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-csk-gold hover:scale-110 transition-transform shadow-lg"
                                    >
                                        <i className="fas fa-arrows-up-down" aria-hidden="true"></i>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="nav-destination" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Destination</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" aria-hidden="true">
                                            <i className="fas fa-location-dot"></i>
                                        </div>
                                        <input 
                                            id="nav-destination"
                                            type="text"
                                            value={destStr}
                                            onChange={(e) => setDestStr(e.target.value)}
                                            placeholder="To location..."
                                            className="w-full bg-gray-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-csk-gold/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Travel Strategy</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {modes.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setTravelMode(m.id)}
                                            aria-label={`Select ${m.name} mode`}
                                            aria-pressed={travelMode === m.id}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                                travelMode === m.id 
                                                ? 'bg-csk-gold/10 border-csk-gold text-csk-gold shadow-[0_0_15px_rgba(249,205,5,0.1)]' 
                                                : 'bg-gray-900/50 border-white/5 text-gray-400 hover:bg-gray-800'
                                            }`}
                                        >
                                            <i className={`fas ${m.icon} text-sm`} aria-hidden="true"></i>
                                            <span className="text-[9px] font-bold uppercase tracking-tighter">{m.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle text-rose-500"></i> {error}
                                </div>
                            )}

                            <button 
                                type="button"
                                onClick={handleCalculateRoute}
                                aria-label="Compute optimal navigation path"
                                className="w-full py-4 bg-gradient-to-r from-csk-gold to-yellow-600 text-black font-black text-sm rounded-xl shadow-xl hover:shadow-csk-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <i className="fas fa-paper-plane" aria-hidden="true"></i> Compute Optimal Path
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in pb-10">
                            <div className="p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl relative overflow-hidden">
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Estimated Arrival</div>
                                        <div className="text-3xl font-black text-white">{routeInfo.duration}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Payload</div>
                                        <div className="text-xl font-black text-white">{routeInfo.distance}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[11px] text-indigo-200">
                                    <i className="fas fa-shield-halved text-emerald-400"></i> Route secure · Encrypted telemetry active
                                </div>
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <i className="fas fa-route text-6xl -rotate-12"></i>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-list-ol text-csk-gold"></i> Step-by-Step Maneuvers
                                </h3>

                                {transitNarrative && (
                                     <div className="p-4 bg-csk-gold/10 border border-csk-gold/20 rounded-2xl animate-fade-in shadow-lg relative overflow-hidden group">
                                         <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                             <i className="fas fa-chess-knight text-8xl text-csk-gold rotate-12"></i>
                                         </div>
                                         <div className="text-[10px] font-black text-csk-gold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                             <span className="w-1 h-1 rounded-full bg-csk-gold animate-pulse"></span>
                                             Tactical Briefing
                                         </div>
                                         <div className="text-[11px] font-bold text-gray-100 leading-relaxed italic pr-4">
                                             {transitNarrative}
                                         </div>
                                     </div>
                                 )}

                                <div className="space-y-0.5 border-l-2 border-indigo-500/20 ml-2 pl-6">
                                    {directionsSteps.map((step, idx) => {
                                         const isTransit = step.travel_mode === 'TRANSIT' && step.transit;
                                         const tactical = getTacticalAdvice(step, idx > 0 ? directionsSteps[idx-1] : null);
                                         
                                         return (
                                             <div key={idx} className="relative py-4 group">
                                                 <div className={`absolute -left-[33px] top-5 w-4 h-4 rounded-full bg-gray-900 border-2 flex items-center justify-center z-10 ${isTransit ? 'border-csk-gold' : 'border-indigo-50'}`}>
                                                     <div className={`w-1.5 h-1.5 rounded-full ${isTransit ? 'bg-csk-gold' : 'bg-indigo-500'}`}></div>
                                                 </div>
                                                 <div className="flex flex-col gap-1">
                                                     <div className="flex items-center gap-2 mb-1">
                                                         {isTransit && (
                                                             <span className="bg-csk-gold/20 text-csk-gold text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-csk-gold/30">
                                                                 {
                                                                     (step.transit.line.name || '').toLowerCase().includes('mrts') || 
                                                                     (step.transit.line.name || '').toLowerCase().includes('velachery') ||
                                                                     ['RAIL', 'HEAVY_RAIL', 'COMMUTER_TRAIN'].includes(step.transit.line.vehicle.type)
                                                                     ? "Local Train" 
                                                                     : step.transit.line.vehicle.name
                                                                 }
                                                             </span>
                                                         )}
                                                         <div 
                                                             className={`text-sm leading-relaxed font-bold ${isTransit ? 'text-white' : 'text-gray-300'}`}
                                                             dangerouslySetInnerHTML={{ __html: step.instructions }}
                                                         ></div>
                                                     </div>

                                                     {isTransit && (
                                                         <div className="mb-2 p-2.5 bg-csk-gold/5 border border-csk-gold/20 rounded-lg flex flex-col gap-1.5 shadow-inner">
                                                             <div className="flex items-center gap-2">
                                                                 <div className="w-6 h-6 rounded bg-csk-gold flex items-center justify-center text-black font-black text-[10px] shadow">
                                                                     {step.transit.line.short_name || step.transit.line.name.charAt(0)}
                                                                 </div>
                                                                 <div className="flex flex-col">
                                                                     <span className="text-[11px] font-black text-white leading-none mb-0.5">
                                                                         {step.transit.line.short_name ? `Line ${step.transit.line.short_name}` : step.transit.line.name}
                                                                     </span>
                                                                     {step.transit.headsign && (
                                                                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                                                             Towards {step.transit.headsign}
                                                                         </span>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                             <div className="flex items-center gap-3 mt-0.5 pl-0.5">
                                                                 <div className="flex flex-col">
                                                                     <div className="text-[9px] font-black text-emerald-400/80 uppercase">Board at</div>
                                                                     <div className="text-[10px] font-bold text-gray-200">{step.transit.departure_stop.name}</div>
                                                                 </div>
                                                                 <i className="fas fa-arrow-right text-[8px] text-gray-700"></i>
                                                                 <div className="flex flex-col">
                                                                     <div className="text-[9px] font-black text-rose-400/80 uppercase">Alight at</div>
                                                                     <div className="text-[10px] font-bold text-gray-200">{step.transit.arrival_stop.name}</div>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )}

                                                     {tactical && (
                                                         <div className="mt-1 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl animate-fade-in shadow-sm">
                                                             <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                                                 <i className={`fas ${tactical.icon} text-indigo-400`}></i> {tactical.title}
                                                             </div>
                                                             <div className="text-[10px] font-bold text-indigo-100/90 leading-relaxed italic">
                                                                 {tactical.advice}
                                                             </div>
                                                         </div>
                                                     )}

                                                     <div className="flex items-center gap-3 mt-1">
                                                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{step.distance.text}</span>
                                                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{step.duration.text}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                </div>
                            </div>

                            <button 
                                type="button"
                                onClick={() => setShowDirections(false)}
                                aria-label="Edit route parameters and recalculate"
                                className="w-full py-4 bg-gray-800 text-gray-300 font-black text-sm rounded-xl border border-white/5 hover:bg-gray-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <i className="fas fa-edit" aria-hidden="true"></i> Recalculate Logic
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-950 border-t border-white/5 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">GPS Navigation Active</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 opacity-40 select-none">
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Powered by Google Maps Directions API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Nearby transport via Google Places API</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Address conversion via Geocoding API</div>
                        <div className="text-[8px] font-bold text-orange-500/80 uppercase">Real-time Telemetry via Google Firebase</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(NavigationPanel);
