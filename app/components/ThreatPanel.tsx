import { ChevronRight } from 'lucide-react';
import { EventItem, displayTitleFor } from '../lib/events';

interface ThreatPanelProps {
    topThreat?: EventItem;
}

export function ThreatPanel({ topThreat }: ThreatPanelProps) {
    if (!topThreat) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-red-500/5 p-4 group cursor-pointer hover:bg-red-500/10 transition-colors">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.03)_10px,rgba(239,68,68,0.03)_20px)] pointer-events-none" />

            <div className="relative flex items-start gap-4">
                {/* Score Box */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span className="text-xl font-bold text-red-500">{topThreat.severity}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-red-400">Top Priority</span>
                    </div>

                    <h3 className="font-bold text-zinc-100 text-sm leading-tight truncate pr-2 group-hover:text-white">
                        {displayTitleFor(topThreat)}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400">
                        {topThreat.summary}
                    </p>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-red-500 transition-colors self-center" />
            </div>
        </div>
    );
}
