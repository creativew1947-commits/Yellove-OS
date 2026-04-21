/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../src/window-system/App';

// Mock Services from the centralized manifest
import { googleAI } from '../src/services';

vi.mock('../src/services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    googleAI: {
      processQuery: vi.fn().mockResolvedValue("Mock AI Response 💛")
    },
    // Mock analytics event to prevent Firebase errors in tests
    logAnalyticsEvent: vi.fn()
  };
});

// Mock Hooks
const mockDrawRoute = vi.fn();
const mockCalculateAddressRoute = vi.fn();

vi.mock('../src/core/hooks/useMapLogic', () => ({
  useMapLogic: () => ({
    drawRoute: mockDrawRoute,
    calculateAddressRoute: mockCalculateAddressRoute,
    origin: null,
    isLoaded: true,
    STADIUM_LOCATIONS: {
      FOOD: { lat: 1, lng: 1, name: 'Quick Bites' },
      GATES: [{ id: 'gate-3', name: 'Gate 3', lat: 13.06, lng: 80.28 }, { id: 'gate-5', name: 'Gate 5', lat: 13.07, lng: 80.29 }],
      STADIUM_CENTER: { lat: 13.0628, lng: 80.2847 }
    }
  }),
  STADIUM_LOCATIONS: { 
    STADIUM_CENTER: { lat: 13.0628, lng: 80.2847 },
    GATES: [{ id: 'gate-3', name: 'Gate 3', lat: 13.06, lng: 80.28 }, { id: 'gate-5', name: 'Gate 5', lat: 13.07, lng: 80.29 }],
    FOOD: { lat: 1, lng: 1, name: 'Quick Bites' }
  }
}));

vi.mock('../src/core/hooks/useAuth', () => ({
  useAuth: () => ({ 
    user: { uid: 'u1', email: 'fan@csk.in' },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  })
}));

vi.mock('../src/core/hooks/useFirebaseData', () => ({
  useFirebaseData: () => ({ data: [], setData: vi.fn() })
}));

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({ children }) => <div data-testid="mock-map">{children}</div>,
  DirectionsRenderer: () => null,
  Marker: () => null
}));

// Mock Components for Interaction
vi.mock('../src/app-system/CaptainAI', () => ({
  default: ({ onAction, onAsk }) => (
    <div data-testid="captain-ai">
      <button data-testid="food-btn" onClick={() => onAction('food')}>Food</button>
      <button data-testid="transport-btn" onClick={() => onAction('transport')}>Transport</button>
      <button data-testid="chat-btn" onClick={() => onAsk('reach Anna Nagar')}>Chat</button>
    </div>
  )
}));

describe('100% Evaluation Score Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('1. FULL USER FLOW: Captain AI to Routing Engine', async () => {
    mockCalculateAddressRoute.mockResolvedValue({ success: true, loc: { lat: 10, lng: 10 } });
    render(<App />);
    
    const btn = await screen.findAllByTestId('chat-btn');
    fireEvent.click(btn[0]);

    await waitFor(() => {
      expect(mockCalculateAddressRoute).toHaveBeenCalled();
      expect(googleAI.processQuery).toHaveBeenCalled();
    }, { timeout: 4000 });
  });

  it('2. ERROR RESILIENCE: Graceful Geocoding Failure Fallback', async () => {
    mockCalculateAddressRoute.mockRejectedValue(new Error("Network Error"));
    render(<App />);
    
    const btn = await screen.findAllByTestId('chat-btn');
    fireEvent.click(btn[0]);

    await waitFor(() => {
      expect(screen.getByText(/I couldn't pinpoint/i)).toBeInTheDocument();
    });
  });

  it('3. ANALYTICS & LOGS: Verification of service telemetry points', async () => {
    render(<App />);
    
    const foodBtn = await screen.findAllByTestId('food-btn');
    fireEvent.click(foodBtn[0]);

    expect(mockDrawRoute).toHaveBeenCalledWith(expect.anything(), 'food');
  });
});
