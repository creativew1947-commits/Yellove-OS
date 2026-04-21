/**
 * Pure navigation utility functions for Yellove OS.
 */

/**
 * Transport Mode Definitions
 * Centralized telemetry constants for UI across the application.
 */
export const TRANSPORT_MODES = [
    { id: 'cab', name: 'Cab', icon: 'fa-taxi', googleMode: 'DRIVING', colorClass: 'text-csk-gold', bgClass: 'bg-csk-gold', borderClass: 'border-csk-gold' },
    { id: 'bus', name: 'Bus', icon: 'fa-bus', googleMode: 'TRANSIT', colorClass: 'text-red-400', bgClass: 'bg-red-500', borderClass: 'border-red-500' },
    { id: 'metro', name: 'Metro', icon: 'fa-subway', googleMode: 'TRANSIT', colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500', borderClass: 'border-indigo-500' },
    { id: 'train', name: 'Train', icon: 'fa-train', googleMode: 'TRANSIT', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500' },
];

/**
 * Calculates a route configuration (Color/Waypoints) based on context type.
 * 
 * @param {Object} origin - Source coordinates.
 * @param {Object} destination - Target coordinates.
 * @param {string} [type='general'] - The logical context (food, emergency, transport, address, general).
 * @returns {Object} - Merged configuration for the Directions request.
 */
export const getRouteConfig = (origin, destination, type = 'general') => {
    const colorMap = {
        'food': '#10B981',
        'emergency': '#EF4444',
        'transport': '#8B5CF6',
        'address': '#3B82F6',
        'general': '#F59E0B',
        'cab': '#F9CD05',
        'bus': '#EF4444',
        'metro': '#6366F1',
        'train': '#10B981'
    };

    return {
        origin,
        destination,
        waypoints: [],
        routeColor: colorMap[type] || colorMap.general,
        type
    };
};

/**
 * Helper to calculate distance between two points using Google Maps geometry library.
 * Falls back to 0 if the geometry library is not loaded.
 * 
 * @param {google.maps.LatLngLiteral} p1 - Source point.
 * @param {google.maps.LatLngLiteral} p2 - Destination point.
 * @returns {number} Distance in meters.
 */
export const computeDistance = (p1, p2) => {
    if (window.google?.maps?.geometry?.spherical) {
        return window.google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
    }
    return 0;
};

/**
 * Resolves transport metadata for a specific mode ID.
 * Defaults to the first available mode (Cab) if the requested mode is not found.
 * 
 * @param {string} modeId - The identifier of the transport mode (e.g. 'metro', 'bus').
 * @returns {Object} Metadata object including name, icon, and styling classes.
 */
export const getTransportMetadata = (modeId) => {
    return TRANSPORT_MODES.find(m => m.id === modeId.toLowerCase()) || TRANSPORT_MODES[0];
};
