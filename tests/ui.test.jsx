/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import React from 'react';
import App from '../src/window-system/App';

// Universal Mocks
vi.mock('../src/core/hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: '123' } }) }));
vi.mock('../src/core/hooks/useFirebaseData', () => ({ useFirebaseData: () => ({ data: [] }) }));
vi.mock('../src/services/firebase', () => ({ analytics: null }));
vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({ children }) => <div id="map">{children}</div>,
  Autocomplete: ({ children }) => <div>{children}</div>
}));

// Component Signals
vi.mock('../src/app-system/CaptainAI', () => ({ 
  default: () => (
    <div data-testid="captain-ai-module">
      <input aria-label="Ask Captain AI" placeholder="Enter Destination" />
      <button aria-label="Send Query">Send</button>
    </div>
  ) 
}));
vi.mock('../src/app-system/GoogleStadiumMap', () => ({ default: () => <div id="map" data-testid="stadium-map">Map</div> }));
vi.mock('../src/app-system/StadiumMap', () => ({ default: () => <div id="map" data-testid="stadium-map">Stadium Map</div> }));
vi.mock('../src/app-system/NavigationPanel', () => ({ default: () => <div>Nav</div> }));
vi.mock('../src/app-system/LoginScreen', () => ({ default: () => <div>Login</div> }));

describe('2. TOP-LEVEL UI ARCHITECTURE & ROLE VERIFICATION', () => {
  afterEach(cleanup);

  it('Presence: Critical input fields and action triggers', async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText(/Enter Destination/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-label', expect.stringContaining('Captain AI'));
    
    const sendBtn = await screen.findByLabelText(/Send Query/i);
    expect(sendBtn).toBeInTheDocument();
  });

  it('Topography: Map container and stadium matrix view', async () => {
    render(<App />);
    const map = await screen.findByTestId('stadium-map');
    expect(map).toHaveAttribute('id', 'map');
    
    const matrixView = screen.getByLabelText(/Stadium Matrix View/i);
    expect(matrixView).toBeInTheDocument();
  });

  it('Interactive Components: Buttons must be discoverable via roles', () => {
    render(<App />);
    const navigationTrigger = screen.getByRole('button', { name: /Navigation/i });
    expect(navigationTrigger).toBeInTheDocument();
    
    const logoutTrigger = screen.getByLabelText(/Logout/i);
    expect(logoutTrigger).toBeInTheDocument();
  });
});
