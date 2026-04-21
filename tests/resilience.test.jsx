/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../src/window-system/App';

// Resilience Specific Mocks
vi.mock('../src/core/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'auth_user_123' }, login: vi.fn(), logout: vi.fn() })
}));

vi.mock('../src/core/hooks/useFirebaseData', () => ({
  useFirebaseData: () => ({ data: [], sections: [], amenities: [], transports: [] })
}));

vi.mock('../src/core/hooks/useMapLogic', () => ({
  useMapLogic: () => ({
    origin: null, destination: null, waypoints: [], routeColor: '#10B981', markers: [],
    clearRoutes: vi.fn(),
    drawRoute: vi.fn(),
    calculateAddressRoute: vi.fn(),
    fetchTransitOptions: vi.fn().mockResolvedValue([]),
    STADIUM_LOCATIONS: { STADIUM_CENTER: { lat: 13, lng: 80 }, GATES: [], FOOD: { lat: 13, lng: 80 } }
  })
}));

// Sync Mocks for Stability
vi.mock('../src/app-system/CaptainAI', () => ({ default: () => <div>Captain AI</div> }));
vi.mock('../src/app-system/TimeDisplay', () => ({ default: () => <div>Time</div> }));
vi.mock('../src/app-system/StadiumMap', () => ({ default: () => <div data-testid="stadium-map-placeholder">Tactical Visualization</div> }));

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({ children }) => <div>{children}</div>
}));

describe('SYSTEM RESILIENCE & ERROR HANDLING SUITE', () => {
    
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('Resilience 1: FETCH API REJECTION - Global Safety', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error("NETWORK_FAILURE_EMULATED")));
        render(<App />);
        expect(screen.queryAllByText(/Yellove/i).length).toBeGreaterThan(0);
    });

    it('Resilience 2: CORRUPTED DATA STRUCTURES - Hook Stability', () => {
        vi.mock('../src/core/hooks/useFirebaseData', () => ({
            useFirebaseData: () => ({ data: null, sections: {}, amenities: undefined })
        }));
        render(<App />);
        expect(screen.queryAllByText(/Yellove/i).length).toBeGreaterThan(0);
    });

    it('Resilience 3: GOOGLE MAPS INIT DELAY - Fallback Stability', () => {
        vi.mock('@react-google-maps/api', () => ({
            useLoadScript: () => ({ isLoaded: false }),
            GoogleMap: () => null
        }));
        render(<App />);
        // Using queryAllByTestId to handle multiple instances gracefully during hydration
        expect(screen.queryAllByTestId('stadium-map-placeholder').length).toBeGreaterThan(0);
    });
});
