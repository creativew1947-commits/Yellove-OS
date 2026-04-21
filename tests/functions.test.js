/** @vitest-environment jsdom */
/* global global */
import { describe, it, expect, vi } from 'vitest';
import { drawRoute, geocodeAddress, getNearbyTransport } from '../src/services';
import { STADIUM_LOCATIONS } from '../src/core/config/constants';

// Force global google mock for consistent function testing
global.window = global.window || {};
global.window.google = {
    maps: {
        Geocoder: function() {
            this.geocode = vi.fn();
        },
        places: {
            PlacesService: vi.fn(),
            PlacesServiceStatus: { OK: 'OK' }
        },
        DirectionsService: function() {
            this.route = (req, cb) => cb({ routes: [{ legs: [{ distance: { text: '1km' }, duration: { text: '5m' } }] }] }, 'OK');
        },
        TravelMode: { DRIVING: 'DRIVING' }
    }
};

describe('4. TOP-LEVEL FUNCTION LOGIC & SIGNATURES', () => {
  describe('drawRoute Logic', () => {
    it('Function exists and maintains an asynchronous execution contract', async () => {
      expect(drawRoute).toBeDefined();
      // Test drawing route to verify Promise resolution
      const result = await drawRoute(null, { lat: 13, lng: 80 }, { lat: 13.1, lng: 80.1 }, null);
      expect(result).toHaveProperty('routes');
    });
  });

  describe('Geocode & Places Service Availability', () => {
    it('geocodeAddress maintains an asynchronous signature', () => {
      expect(geocodeAddress).toBeInstanceOf(Function);
      const promise = geocodeAddress('Stadium');
      expect(promise).toBeInstanceOf(Promise);
      promise.catch(() => {}); 
    });

    it('getNearbyTransport provides fallback data in disconnected environments', async () => {
      const transport = await getNearbyTransport({ lat: 13, lng: 80 });
      expect(Array.isArray(transport)).toBe(true);
      expect(transport.length).toBeGreaterThan(0);
    });
  });
});
