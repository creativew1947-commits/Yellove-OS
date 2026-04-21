/**
 * Timezone Service - Strategic Time Orchestration.
 * Handles high-availability fetching from multiple redundant time sources.
 */

/**
 * Normalizes the response from various time API providers.
 * @param {Object} data - The raw JSON response from the provider.
 * @returns {string|null} - The standardized ISO datetime string.
 */
const normalizeTimeResponse = (data) => {
    return data.dateTime || data.datetime || null;
};

/**
 * Fetches the current strategic time for the stadium (IST).
 * Implements a multi-source recovery pattern to ensure 100% availability.
 * This ensures that even if one time source is down, the stadium clock remains accurate.
 * 
 * @returns {Promise<Object>} Object containing success status, Date object, and the source identifier.
 */
export const getTime = async () => {
    const strategy = [
        { url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata', provider: 'TIME_API' },
        { url: 'https://worldtimeapi.org/api/timezone/Asia/Kolkata', provider: 'WORLD_TIME_API' }
    ];

    for (const source of strategy) {
        try {
            const response = await fetch(source.url, { signal: AbortSignal.timeout(3000) });
            if (!response.ok) throw new Error(`HTTP_${response.status}`);
            
            const data = await response.json();
            const dateStr = normalizeTimeResponse(data);
            
            if (dateStr) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return { 
                        success: true, 
                        time: date, 
                        source: source.provider 
                    };
                }
            }
        } catch (err) {
            console.warn(`Strategic Time Source [${source.provider}] engaged fallback:`, err.message);
        }
    }

    // High-Precision Local Fallback (Guarantees UI consistency)
    return { 
        success: false, 
        time: new Date(), 
        source: 'LOCAL_PRECISION',
        error: 'ALL_EXTERNAL_SOURCES_EXHAUSTED'
    };
};
