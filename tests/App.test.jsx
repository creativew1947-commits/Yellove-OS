/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../src/window-system/App';

// Top-Level Universal Mocks for Architecture Stability
vi.mock('../src/core/hooks/useAuth', () => ({
  useAuth: () => ({ 
    user: { uid: 'auth_user_123', email: 'fan@yellove.com' }, 
    login: vi.fn(), 
    logout: vi.fn() 
  })
}));
vi.mock('../src/core/hooks/useFirebaseData', () => ({
  useFirebaseData: () => ({ 
    data: [], 
    sections: [{ id: 'S1', count: 10 }, { id: 'S2', count: 5 }],
    amenities: [{ id: 'A1', type: 'food', wait: 5 }],
    friends: []
  })
}));

// Mock useMapLogic to prevent complex dependency chain issues in App renders
vi.mock('../src/core/hooks/useMapLogic', () => ({
  useMapLogic: () => ({
    origin: null, destination: null, waypoints: [], routeColor: '#10B981', markers: [],
    clearRoutes: vi.fn(),
    drawRoute: vi.fn(),
    calculateAddressRoute: vi.fn(),
    fetchTransitOptions: vi.fn().mockResolvedValue([{ id: 'T1', type: 'Taxi', station: 'Main Gate', wait: 5 }]),
    STADIUM_LOCATIONS: { STADIUM_CENTER: { lat: 13, lng: 80 }, FOOD: { lat: 13.1, lng: 80.1 }, GATES: [] }
  }),
  STADIUM_LOCATIONS: { STADIUM_CENTER: { lat: 13, lng: 80 }, FOOD: { lat: 13.1, lng: 80.1 }, GATES: [] }
}));

vi.mock('../src/services/firebase', () => ({ analytics: null, db: {}, auth: {} }));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({ children }) => <div data-testid="universal-map">{children}</div>,
  Marker: () => null,
  DirectionsRenderer: () => null,
  Autocomplete: ({ children }) => <div data-testid="google-autocomplete">{children}</div>
}));

// Synchronous Lazy Component Mocks
vi.mock('../src/app-system/CaptainAI', () => ({ default: () => <aside data-testid="captain-ai">Captain AI Module</aside> }));
vi.mock('../src/app-system/GoogleStadiumMap', () => ({ default: () => <div id="map" data-testid="stadium-map">Google Matrix</div> }));
vi.mock('../src/app-system/NavigationPanel', () => ({ default: () => <section data-testid="nav-panel">Precision Routing</section> }));
vi.mock('../src/app-system/SmartReturnPanel', () => ({ default: () => <div data-testid="return-panel">Fast Return</div> }));
vi.mock('../src/app-system/LoginScreen', () => ({ default: () => <div data-testid="login-screen">Auth Layer</div> }));
vi.mock('../src/app-system/StadiumMap', () => ({ default: () => <div data-testid="stadium-map">Visual Topography</div> }));

describe('1. TOP-LEVEL RENDERING & ACCESSIBILITY', () => {
  afterEach(cleanup);

  it('System Bootstrap: Main layout renders with premium branding and ARIA accessibility', () => {
    const { container } = render(<App />);
    
    // Branding Check
    expect(screen.getByText(/Yellove/i)).toBeInTheDocument();
    expect(screen.getByText(/OS/i)).toBeInTheDocument();
    
    // Semantic Structure Check
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Accessibility: Skip link existence
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('Environment Verification: System announcements and suggestions presence', () => {
    render(<App />);
    expect(screen.getByLabelText(/Tactical Announcements/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Smart Tactical Decisions/i)).toBeInTheDocument();
  });
});
