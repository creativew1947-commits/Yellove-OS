/**
 * Places Service - Strategic Discovery Layer.
 * Orchestrates interaction with Google Places API for transport and waypoint intelligence.
 */

/**
 * Initializes the Autocomplete orchestration for location inputs.
 * 
 * @param {HTMLInputElement} element - The DOM element to attach the autocomplete to.
 * @param {Function} onPlaceChanged - Handler for selected place events.
 * @returns {google.maps.places.Autocomplete|null}
 */
export const initAutocomplete = (element, onPlaceChanged) => {
    if (!window.google?.maps?.places) {
        console.warn("Places Logic deferred: Google Maps SDK not ready.");
        return null;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(element, {
        componentRestrictions: { country: 'IN' },
        fields: ['formatted_address', 'geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (typeof onPlaceChanged === 'function') onPlaceChanged(place);
    });

    return autocomplete;
};

/**
 * Discovers nearby transport hubs around a tactical focal point.
 * 
 * @param {google.maps.LatLngLiteral} location - Focal coordinates {lat, lng}.
 * @param {number} [radius=1000] - Discovery radius in meters.
 * @returns {Promise<Array<Object>>} - List of identified transport nodes.
 */
export const getNearbyTransport = async (location, radius = 1000) => {
    // Strategic Fallback: High-precision static telemetry for Chepauk
    const STATIC_TELEMETRY = [
        { id: 'metro', type: 'Metro', station: 'Govt Estate', lat: 13.0682, lng: 80.2750, wait: 5, url: 'https://tickets.chennaimetrorail.org/onlineticket' },
        { id: 'train', type: 'Local Train', station: 'Chepauk MRTS', lat: 13.0645, lng: 80.2810, wait: 10, url: 'https://www.utsonmobile.indianrail.gov.in' },
        { id: 'bus', type: 'Bus (MTC)', station: 'Wallajah Rd', lat: 13.0650, lng: 80.2798, wait: 8, url: 'https://mtcbus.tn.gov.in/' },
        { id: 'taxi', type: 'Taxi (Ola)', station: 'Ola Point', lat: 13.0635, lng: 80.2785, wait: 2, url: 'https://book.olacabs.com/' }
    ];

    if (!window.google?.maps?.places) {
        console.info("Places Live Discovery offline. Using static stadium telemetry.");
        return STATIC_TELEMETRY;
    }

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    /**
     * Internal helper to wrap Google Callback architecture in Promises.
     */
    const searchPlacesByType = (type) => new Promise((resolve) => {
        service.nearbySearch({ location, radius, type }, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
            } else {
                resolve([]);
            }
        });
    });

    try {
        const [trainRes, transitRes, metroRes, busRes, taxiRes] = await Promise.all([
            searchPlacesByType('train_station'),
            searchPlacesByType('transit_station'),
            searchPlacesByType('subway_station'),
            searchPlacesByType('bus_station'),
            searchPlacesByType('taxi_stand')
        ]);

        const transportLinks = {
            'metro': 'https://tickets.chennaimetrorail.org/onlineticket',
            'train': 'https://www.utsonmobile.indianrail.gov.in',
            'bus': 'https://mtcbus.tn.gov.in/',
            'taxi': 'https://book.olacabs.com/'
        };

        // Combine and filter unique train results (Chepauk MRTS specialty)
        const combinedTrain = [...trainRes, ...transitRes].filter((p, i, s) => 
            s.findIndex(t => t.place_id === p.place_id) === i &&
            (p.name.toLowerCase().includes('mrts') || p.name.toLowerCase().includes('rail'))
        );

        // Map raw Google results to Strategic Schema
        const mapToStrategicType = (place, type, defaultName, transportType) => {
            if (!place) return { ...STATIC_TELEMETRY.find(t => t.id === transportType), wait: 10 };
            return {
                id: transportType,
                type: type,
                station: place.name || defaultName,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                wait: type === 'Taxi (Ola)' ? 2 : 8,
                url: transportLinks[transportType]
            };
        };

        return [
            mapToStrategicType(metroRes[0], 'Metro', 'Govt Estate', 'metro'),
            mapToStrategicType(combinedTrain[0], 'Local Train', 'Chepauk MRTS', 'train'),
            mapToStrategicType(busRes[0], 'Bus (MTC)', 'Wallajah Rd', 'bus'),
            mapToStrategicType(taxiRes[0], 'Taxi (Ola)', 'Ola Point', 'taxi')
        ].filter(Boolean);

    } catch (err) {
        console.warn("Places Strategic Discovery failure. Falling back to static telemetry:", err);
        return STATIC_TELEMETRY;
    }
};
