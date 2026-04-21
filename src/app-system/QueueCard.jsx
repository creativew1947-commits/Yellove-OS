import React from 'react';

const QueueCard = ({ item }) => (
    <div className="flex justify-between items-center bg-gray-900/40 hover:bg-gray-800/80 p-3 rounded-lg border border-white/5 transition-colors group">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'food' ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                <i className={`fas ${item.type === 'food' ? 'fa-hamburger' : 'fa-restroom'}`} aria-hidden="true"></i>
            </div>
            <div>
                <div className="text-sm font-semibold text-gray-200">{item.name}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{item.loc}</div>
            </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border ${item.wait < 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : item.wait < 10 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:animate-pulse'}`}>
            <i className="far fa-clock" aria-hidden="true"></i> <span aria-label={`${item.wait} minutes wait`}>{item.wait}m</span>
        </div>
    </div>
);

export default React.memo(QueueCard);
