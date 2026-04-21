/**
 * Application Constants - Centralized Manifest
 * Handles global telemetry coordinates and security thresholds.
 */

export const STADIUM_LOCATIONS = {
    STADIUM_CENTER: { lat: 13.0628, lng: 80.2793 },
    GATES: [
        { id: 'gate-3', name: 'Gate 3 (North)', lat: 13.0640, lng: 80.2805 },
        { id: 'gate-5', name: 'Gate 5 (South)', lat: 13.0610, lng: 80.2770 }
    ],
    FOOD: { lat: 13.0632, lng: 80.2798, name: 'Quick Bites' }
};

export const APP_CONFIG = {
    MAX_CHAT_LENGTH: 500,
    MIN_INPUT_LENGTH: 2,
    DEFAULT_RADIUS: 500,
    CSK_THEME_COLOR: '#f0c419',
    EMERGENCY_GATE_ID: 'gate-3'
};

export const ANNOUNCEMENTS = [
    "LOUD CHEERS! Captain Cool marks his guard. Next 5 mins will be highly active! 💛",
    "Gate 3 is experiencing slow traffic. Please route via Gate 5.",
    "Flash Offer: 20% off at Super Kings Cafe right now!",
    "Strategic Timeout expected in 3.5 mins. Plan your food runs."
];
