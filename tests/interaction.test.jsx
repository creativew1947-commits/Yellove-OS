/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../src/window-system/App';

// Comprehensive Mocks
const mockDrawRoute = vi.fn().mockResolvedValue(true);

vi.mock('../src/services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    googleAI: {
      processQuery: vi.fn().mockResolvedValue("AI Thinking Result")
    },
    logAnalyticsEvent: vi.fn()
  };
});

vi.mock('../src/core/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: '123', displayName: 'MS Dhoni' }, login: vi.fn(), logout: vi.fn() })
}));

vi.mock('../src/core/hooks/useFirebaseData', () => ({
  useFirebaseData: (path) => ({ 
    data: path === 'queueTimes' ? [{ id: 'f1', name: 'Cafe', wait: 5, type: 'food' }] : [], 
    setData: vi.fn() 
  })
}));

vi.mock('../src/core/hooks/useMapLogic', () => ({
  useMapLogic: () => ({
    origin: null, 
    destination: null, 
    waypoints: [], 
    routeColor: '#10B981', 
    markers: [],
    clearRoutes: vi.fn(),
    drawRoute: mockDrawRoute,
    calculateAddressRoute: vi.fn(),
    fetchTransitOptions: vi.fn().mockResolvedValue([]),
    STADIUM_LOCATIONS: { 
        STADIUM_CENTER: { lat: 13, lng: 80 }, 
        FOOD: { lat: 13, lng: 80, name: 'Quick Bites' },
        GATES: [{ id: 'gate-3', name: 'Gate 3' }]
    }
  })
}));

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: () => null,
  Marker: () => null,
  DirectionsRenderer: () => null,
  Autocomplete: ({ children }) => <div>{children}</div>
}));

describe('Yellove OS Interaction Flows (Advanced)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('Orchestration: Assistant Query -> Routing Action -> AI Response', async () => {
    render(<App />);
    
    // 1. Locate Assistant components (Labels updated to match new App.jsx)
    const input = await screen.findByPlaceholderText(/Ask Captain/i);
    const sendBtn = await screen.findByLabelText(/Send message to Captain AI/i);
    
    // 2. Trigger "Food" query
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Where is food?' } });
      fireEvent.click(sendBtn);
    });

    // Strategy: Food keyword triggers immediate drawRoute in handleAskAssistant
    await waitFor(() => {
        expect(mockDrawRoute).toHaveBeenCalled();
    });
    
    // Verify the response appears in chat
    const aiResponse = await screen.findByText(/AI Thinking Result/i);
    expect(aiResponse).toBeInTheDocument();
  });

  it('Logistics: Triggering Quick Actions from UI Buttons', async () => {
    render(<App />);
    
    // Find a decision engine button
    const foodActionBtn = await screen.findByLabelText(/Best Food/i);
    
    await act(async () => {
      fireEvent.click(foodActionBtn);
    });

    expect(mockDrawRoute).toHaveBeenCalled();
  });
});
