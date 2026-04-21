
/**
 * Geocoding Service - Converts human-readable addresses to coordinate telemetry.
 * Leverages the Google Maps Geocoding API for high-precision stadium mapping.
 */

/**
 * Geocodes an address string into latitude and longitude coordinates.
 * @param {string} address - The physical address query.
 * @returns {Promise<Object>} - Coordinates {lat, lng} and name.
 */
// Converts address using Geocoding API
export const geocodeAddress = async (address) => {
    if (!window.google || !window.google.maps.Geocoder) {
        throw new Error("Google Maps Geocoder not available");
    }

    const geocoder = new window.google.maps.Geocoder();
    
    try {
        return new Promise((resolve) => {
            if (!address || address.trim() === "") {
                console.warn("Geocode attempt with empty address");
                return resolve(null);
            }

            // Interacting with Google Geocoding API
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const loc = results[0].geometry.location;
                    resolve({
                        lat: loc.lat(),
                        lng: loc.lng(),
                        name: address
                    });
                } else {
                    console.warn(`Geocoding status: ${status}`);
                    resolve(null); // Return null instead of rejecting to avoid app-level crashes
                }
            });
        });
    } catch (error) {
        console.error("Geocode Service Exception:", error);
        return null;
    }
};
