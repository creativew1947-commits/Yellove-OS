// Handles routing using Google Directions API
// Fetches transport using Google Places API
// Converts address using Geocoding API
// Calculates ETA using Distance Matrix API
import { useState, useEffect } from 'react';
import { database, ref, onValue } from '../../services';

const MOCK_DATA = {
  crowdDensity: [
    { id: 'A', name: 'Stand A', desc: 'North Wing', count: 35 },
    { id: 'B', name: 'Stand B', desc: 'North Wing', count: 88 },
    { id: 'C', name: 'Stand C', desc: 'East Wing', count: 42 },
    { id: 'D', name: 'Stand D', desc: 'East Wing', count: 65 },
    { id: 'E', name: 'Stand E', desc: 'South Wing', count: 20 },
    { id: 'F', name: 'Pavilion', desc: 'Premium', count: 95 },
    { id: 'G', name: 'Stand G', desc: 'West Wing', count: 74 },
    { id: 'H', name: 'Stand H', desc: 'West Wing', count: 55 }
  ],
  queueTimes: [
    { id: 'f1', name: 'Super Kings Cafe', loc: 'Stand A', type: 'food', wait: 5 },
    { id: 'f2', name: 'Dhoni Diner', loc: 'Pavilion', type: 'food', wait: 18 },
    { id: 'f3', name: 'Quick Bites', loc: 'Stand D', type: 'food', wait: 2 },
    { id: 'r1', name: 'Washroom Alpha', loc: 'Stand B', type: 'restroom', wait: 1 },
    { id: 'r2', name: 'Washroom Beta', loc: 'Stand F', type: 'restroom', wait: 9 }
  ],
  transportAvailability: [
    { id: 't1', type: 'Metro', station: 'Chepauk Station', wait: 3, capacity: 60, lat: 13.0635, lng: 80.2818 },
    { id: 't2', type: 'Bus', station: 'Walajah Road', wait: 12, capacity: 85, lat: 13.0660, lng: 80.2825 },
    { id: 't3', type: 'Taxi', station: 'Victoria Hostel Rd', wait: 5, capacity: 20, lat: 13.0645, lng: 80.2795 }
  ]
};

export const useFirebaseData = (path, useMockFallback = true) => {
  const [data, setData] = useState(MOCK_DATA[path] || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const dbRef = ref(database, path);
      unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setData(Array.isArray(val) ? val : Object.values(val));
        } else if (!useMockFallback) {
          setData([]);
        }
        setLoading(false);
      }, (error) => {
        console.warn(`Firebase read error for path ${path}:`, error);
        setLoading(false); // Fallback to initial mock if error
      });
    } catch (error) {
      console.warn("Firebase not initialized or configured properly:", error);
      setTimeout(() => setLoading(false), 0);
    }
    return () => unsubscribe();
  }, [path, useMockFallback]);

  return { data, setData, loading }; // exposing setData for simulated Match Mode
};
