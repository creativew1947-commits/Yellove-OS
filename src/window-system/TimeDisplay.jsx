import React, { useState, useEffect } from 'react';
import { getTime } from '../services';

const TimeDisplay = ({ className = "" }) => {
    const [time, setTime] = useState(null);
    const [error, setError] = useState(false);

    const fetchTime = async () => {
        const result = await getTime();
        setTime(result.time);
        setError(!result.success);
    };

    useEffect(() => {
        fetchTime();
        // Update every second locally once initialized
        const timer = setInterval(() => {
            setTime(prev => prev ? new Date(prev.getTime() + 1000) : new Date());
        }, 1000);

        // Re-sync with API every 5 minutes
        const syncTimer = setInterval(fetchTime, 300000);

        return () => {
            clearInterval(timer);
            clearInterval(syncTimer);
        };
    }, []);

    if (!time) return null;

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${error ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                {formatTime(time)}
                <span className={`ml-2 text-[8px] font-black tracking-tighter px-1.5 py-0.5 rounded border ${error ? 'text-amber-500/80 border-amber-500/20' : 'text-emerald-500/80 border-emerald-500/20'}`}>
                    {error ? 'PRC' : 'LIVE'}
                </span>
            </span>
        </div>
    );
};

export default TimeDisplay;
