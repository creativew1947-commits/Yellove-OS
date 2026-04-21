
/**
 * Navigation Service - Centralized logic for route calculation and optimization.
 * Orchestrates the Google Directions API and Routes API to provide tactical routing for Yellove OS.
 */

import { getRoute } from './routesService';

/**
 * Executes a path calculation request. 
 * Centralized routing execution handling both path calculation and map rendering.
 *
 * // Handles routing using Google Directions API
 */
export const drawRoute = async (map, origin, destination, renderer, travelMode = 'DRIVING', waypoints = [], transitOptions = null) => {
    let effectiveMode = travelMode;
    const searchModeLower = String(travelMode || '').toLowerCase();

    // Mapping intent to effective Google Travel Modes
    if (searchModeLower.includes('train')) {
        effectiveMode = 'TRANSIT';
    } else if (searchModeLower.includes('metro')) {
        if (!searchModeLower.includes('transit')) effectiveMode = 'TRANSIT';
    } else if (searchModeLower.includes('bus')) {
        if (!searchModeLower.includes('transit')) effectiveMode = 'TRANSIT';
    } else if (searchModeLower.includes('cab') || searchModeLower.includes('taxi')) {
        effectiveMode = 'DRIVING';
    }

    const isTransitIntent = effectiveMode === 'TRANSIT' || searchModeLower.includes('transit');

    /**
     * Requirement: Use Directions API (v1) for ALL Transit requests.
     * Legacy Directions API is more reliable for specialized transport like the Chennai MRTS.
     */
    if (!isTransitIntent && waypoints.length === 0 && (typeof origin !== 'string' && typeof destination !== 'string')) {
        try {
            const routesResult = await getRoute(origin, destination, effectiveMode, transitOptions);
            if (renderer && typeof renderer.setDirections === 'function') {
                renderer.setDirections(routesResult);
            }
            return routesResult;
        } catch {
            console.warn("Routes API optimized path failed, falling back to Directions Service.");
        }
    }

    // Standard Directions API Fallback / Primary for Transit & Address queries
    const googleMapsInstance = window.google?.maps;
    if (!googleMapsInstance || !googleMapsInstance.DirectionsService) {
        return Promise.reject(new Error("Google Maps Directions Service not available"));
    }

    const directionsService = new googleMapsInstance.DirectionsService();
    
    let mode = googleMapsInstance.TravelMode.DRIVING;
    const finalModeLower = effectiveMode.toLowerCase();
    
    if (finalModeLower.includes('walk')) mode = googleMapsInstance.TravelMode.WALKING;
    else if (finalModeLower.includes('transit')) mode = googleMapsInstance.TravelMode.TRANSIT;
    else if (finalModeLower.includes('bike')) mode = googleMapsInstance.TravelMode.BICYCLING;

    const request = {
        origin,
        destination,
        waypoints: waypoints.map(wp => ({ location: wp, stopover: true })),
        travelMode: mode,
    };

    /**
     * Transit Normalization - Ensures compatibility between UI intent and API constants.
     */
    if (mode === googleMapsInstance.TravelMode.TRANSIT) {
        if (transitOptions) {
            const normalizedOptions = { ...transitOptions };
            if (normalizedOptions.modes) {
                normalizedOptions.modes = normalizedOptions.modes.map(m => {
                    // Normalize string ids to Google Enums with robust fallbacks
                    if (m === 'RAIL' || m === 'train' || m === 'COMMUTER_TRAIN') return googleMapsInstance.TransitMode?.RAIL || 'RAIL';
                    if (m === 'SUBWAY' || m === 'metro' || m === 'METRO_RAIL') return googleMapsInstance.TransitMode?.SUBWAY || 'SUBWAY';
                    if (m === 'BUS' || m === 'bus') return googleMapsInstance.TransitMode?.BUS || 'BUS';
                    return m;
                });
            }
            // Ensure routing preference is set if not provided
            if (!normalizedOptions.routingPreference) {
                normalizedOptions.routingPreference = googleMapsInstance.TransitRoutePreference?.FEWER_TRANSFERS;
            }
            request.transitOptions = normalizedOptions;
        } else if (searchModeLower.includes('train')) {
            request.transitOptions = {
                modes: [googleMapsInstance.TransitMode?.RAIL || 'RAIL'],
                routingPreference: googleMapsInstance.TransitRoutePreference?.FEWER_TRANSFERS
            };
        } else if (searchModeLower.includes('metro')) {
            request.transitOptions = {
                modes: [googleMapsInstance.TransitMode?.SUBWAY || 'SUBWAY'],
                routingPreference: googleMapsInstance.TransitRoutePreference?.FEWER_TRANSFERS
            };
        } else if (searchModeLower.includes('bus')) {
            request.transitOptions = {
                modes: [googleMapsInstance.TransitMode?.BUS || 'BUS'],
                routingPreference: googleMapsInstance.TransitRoutePreference?.FEWER_TRANSFERS
            };
        }
    }

    try {
        return new Promise((resolve, reject) => {
            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    if (renderer && typeof renderer.setDirections === 'function') {
                        renderer.setDirections(result);
                    }
                    resolve(result);
                } else {
                    console.warn(`Routing calculation failed: ${status}`);
                    // Rejecting to allow callers (and tests) to handle terminal failures explicitly
                    reject(new Error(`Routing calculation failed: ${status}`));
                }
            });
        });
    } catch (error) {
        console.error("Navigation Service Exception:", error);
        throw error;
    }
};

/**
 * Executes a cascading routing search, prioritizing preferred modes but falling back 
 * to multi-modal transit if primary targets are unreachable.
 */
export const getOptimalTransitRoute = async (origin, destination, preferredModeId) => {
    const constants = getTransitConstants();
    let primaryMode = [constants.SUBWAY, constants.RAIL, constants.BUS];
    
    if (preferredModeId === 'metro') primaryMode = [constants.SUBWAY];
    else if (preferredModeId === 'train') primaryMode = [constants.RAIL];
    else if (preferredModeId === 'bus') primaryMode = [constants.BUS];

    const tryRouting = async (modes) => {
        const transitOptions = {
            modes,
            routingPreference: constants.FEWER_TRANSFERS,
            departureTime: new Date()
        };

        let actualOrigin = origin;
        let manualWalkPrefix = "";
        const waypoints = [];
        
        // Tactical Chepauk Guidance
        if (preferredModeId === 'train' && (String(origin).toLowerCase().includes("chepauk") || String(origin).toLowerCase().includes("stadium"))) {
            actualOrigin = { lat: 13.0645, lng: 80.2810 }; 
            manualWalkPrefix = "Tactical Move: Walk 400m from stadium to Chepauk Station. ";
            
            if (String(destination).toLowerCase().includes("anna") || String(destination).toLowerCase().includes("central")) {
                waypoints.push({ lat: 13.0910, lng: 80.2880 });
            }
        }

        const result = await drawRoute(null, actualOrigin, destination, null, 'TRANSIT', waypoints, transitOptions);
        if (manualWalkPrefix && result.routes?.[0]) {
            result.routes[0].manualWalkPrefix = manualWalkPrefix;
        }
        return result;
    };

    /**
     * CASCADING SEARCH STRATEGY
     * 1. Try primary mode
     * 2. Fallback to dual-rail (Metro/Train)
     * 3. Final fallback to full transit network
     */
    try {
        const result = await tryRouting(primaryMode);
        if (!result.routes?.length) throw new Error("no_path");
        return result;
    } catch {
        try {
            return await tryRouting([constants.SUBWAY, constants.RAIL]);
        } catch {
            return await tryRouting([constants.SUBWAY, constants.RAIL, constants.BUS]);
        }
    }
};

/**
 * Tactical Mode Resolver - Forces mode conventions based on transit type.
 */
export const getTransitConstants = () => {
    const googleMapsInstance = window.google?.maps;
    return {
        SUBWAY: googleMapsInstance?.TransitMode?.SUBWAY || 'SUBWAY',
        RAIL: googleMapsInstance?.TransitMode?.RAIL || 'RAIL',
        BUS: googleMapsInstance?.TransitMode?.BUS || 'BUS',
        FEWER_TRANSFERS: googleMapsInstance?.TransitRoutePreference?.FEWER_TRANSFERS || 'FEWER_TRANSFERS'
    };
};

/**
 * Accessor for core map constants to ensure zero direct window.google usage in UI components.
 */
export const getMapConstants = () => {
    const googleMapsInstance = window.google?.maps;
    return {
        CIRCLE: googleMapsInstance?.SymbolPath?.CIRCLE || 0,
        UNIT_METRIC: googleMapsInstance?.UnitSystem?.METRIC || 0,
        TRAVEL_DRIVING: googleMapsInstance?.TravelMode?.DRIVING || 'DRIVING'
    };
};
