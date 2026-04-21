// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
/**
 * useMapLogic - Custom hook for managing stadium topography and navigation states.
 * Orchestrates interaction between UI and Domain Services.
 */

import { useState, useCallback } from 'react';
import { getRouteConfig } from '../utils';
import { geocodeAddress, getNearbyTransport, getTravelTimes, drawRoute } from '../services';
import { STADIUM_LOCATIONS as STADIUM_CONSTANTS } from '../config/constants';
export const STADIUM_LOCATIONS = STADIUM_CONSTANTS;

/**
 * useMapLogic Hook - Orchestrates stadium navigation state and service interaction
 */
export const useMapLogic = () => {
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [markers, setMarkers] = useState([{ ...STADIUM_LOCATIONS.STADIUM_CENTER, title: "Your Location" }]);
    const [routeColor, setRouteColor] = useState('#10B981');
    const [externalDirections, setExternalDirections] = useState(null);

    /**
     * Resets all active routes on the map
     */
    const clearRoutes = useCallback(() => {
        setOrigin(null);
        setDestination(null);
        setWaypoints([]);
        setExternalDirections(null);
        setMarkers([{ ...STADIUM_LOCATIONS.STADIUM_CENTER, title: "Your Location" }]);
    }, []);

    /**
     * Updates visual path and markers using drawRoute utility
     * // Using drawRoute utility for navigation
     */
    const handleDrawRoute = useCallback(async (target, type = 'general', travelMode = 'DRIVING', transitOptions = null, originOverride = null) => {
        if (!target) return false;

        const effectiveOrigin = originOverride || STADIUM_LOCATIONS.STADIUM_CENTER;
        const configType = type === 'transport' || type === 'address' ? travelMode.toLowerCase() : type;
        const config = getRouteConfig(effectiveOrigin, target, configType);
        setRouteColor(config.routeColor);
        setOrigin(config.origin);
        setDestination(config.destination);
        setWaypoints(config.waypoints);
        
        try {
            // Using drawRoute for ALL routing
            const result = await drawRoute(null, config.origin, config.destination, null, travelMode, config.waypoints, transitOptions);
            setExternalDirections(result);
        } catch (err) {
            console.error("Internal routing failed, using visual path fallback:", err);
            setExternalDirections(null);
        }

        setMarkers([
            { ...STADIUM_LOCATIONS.STADIUM_CENTER, title: "Your Location" },
            { ...target, title: target.name || "Destination" }
        ]);

        return true;
    }, []);

    /**
     * Converts address string to geocoordinates and draws route
     * // Using Geocoding API for address conversion
     */
    const handleAddressRouteCalculation = useCallback(async (addressString) => {
        try {
            // Using Geocoding API to resolve address to coordinates
            const geocodedLocation = await geocodeAddress(addressString);
            await handleDrawRoute(geocodedLocation, 'address');
            return { success: true, loc: geocodedLocation };
        } catch {
            console.warn(`Routing failed for ${addressString} - geocoding threshold reached.`);
            return { success: false };
        }
    }, [handleDrawRoute]);

    /**
     * Fetches nearest transit options for the stadium user
     * // Using Places API for nearby transport
     */
    const fetchTransitOptions = useCallback(async () => {
        // Using Google Places API to fetch transport options
        const rawTransportResults = await getNearbyTransport(STADIUM_LOCATIONS.STADIUM_CENTER);

        // Uses Google Distance Matrix API to calculate tactical travel times
        if (rawTransportResults && rawTransportResults.length > 0) {
            try {
                const destinationPointers = rawTransportResults.map(transportNode => ({ 
                    lat: typeof transportNode.lat === 'function' ? transportNode.lat() : transportNode.lat, 
                    lng: typeof transportNode.lng === 'function' ? transportNode.lng() : transportNode.lng 
                }));
                
                const travelMetrics = await getTravelTimes(STADIUM_LOCATIONS.STADIUM_CENTER, destinationPointers);
                
                // Combine distance matrix metrics with transport data
                return rawTransportResults.map((transportNode, idx) => ({
                    ...transportNode,
                    travelTime: travelMetrics[idx]?.duration || 'N/A',
                    travelDistance: travelMetrics[idx]?.distance || 'N/A'
                }));
            } catch (err) {
                console.warn("Distance Matrix calculation failed - falling back to raw transport telemetry", err);
                return rawTransportResults;
            }
        }
        return rawTransportResults;
    }, []);

    return {
        origin, destination, waypoints, routeColor, markers, externalDirections,
        clearRoutes,
        drawRoute: handleDrawRoute,
        calculateAddressRoute: handleAddressRouteCalculation,
        fetchTransitOptions,
        STADIUM_LOCATIONS
    };
};
