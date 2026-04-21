import { useEffect } from 'react';

/**
 * Custom hook to handle real-time stadium metrics simulation during Match Mode.
 */
export function useStadiumSimulation(matchMode, setSections, setAlert, setFriends) {
    useEffect(() => {
        if (!matchMode) return;

        const simulationTimerId = setInterval(() => {
            // Update crowd counts
            setSections(prevSections => {
                if (!prevSections?.length) return prevSections;
                return prevSections.map(section => ({
                    ...section, 
                    count: Math.max(5, Math.min(99, section.count + (Math.random() * 10 - 5)))
                }));
            });

            // Random Tactical Alerts
            if (Math.random() > 0.9) {
                const tacticalAlerts = [
                    "🔥 DECIBEL SPIKE: Massive roar at Pavillion! Stand F crowded.",
                    "⚡ MOMENTUM SHIFT: Wicket taken! Gates 3/4 experiencing surge.",
                    "🍦 FLASH DEAL: 50% off at Dhoni Diner for next 2 overs!"
                ];
                setAlert(tacticalAlerts[Math.floor(Math.random() * tacticalAlerts.length)]);
                const hideTimer = setTimeout(() => setAlert(null), 6000);
                return () => clearTimeout(hideTimer);
            }

            // Update friend distances
            setFriends(prevFriends => prevFriends.map(friend => ({
                ...friend, 
                dist: Math.max(2, parseInt(friend.dist) + (Math.floor(Math.random() * 10) - 5)) + 'm',
                status: Math.random() > 0.7 ? 'Moving' : 'Stationary'
            })));
        }, 4000);

        return () => clearInterval(simulationTimerId);
    }, [matchMode, setSections, setAlert, setFriends]);
}
