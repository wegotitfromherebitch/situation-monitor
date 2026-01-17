import { Shield } from 'lucide-react';
import { EventItem } from '../lib/events';
import { MapView } from './MapView';

interface GlobalMapProps {
    events: EventItem[];
    onEventClick: (event: EventItem) => void;
    className?: string; // Allow external styling
}

export function GlobalMap({ events, onEventClick, className }: GlobalMapProps) {
    return (
        <div className={`rounded-xl border border-zinc-800 bg-zinc-900/20 relative overflow-hidden flex flex-col group ${className || 'h-[600px]'}`}>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
                <div className="p-1.5 bg-zinc-950/80 backdrop-blur rounded border border-zinc-800">
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="text-xs font-mono text-zinc-500 shadow-black drop-shadow-md">GLOBAL ACTIVITY MONITOR</span>
            </div>

            <div className="flex-1 w-full h-full">
                <MapView events={events} onEventClick={onEventClick} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 to-transparent flex justify-between items-end pointer-events-none">
                <div className="flex gap-4 text-xs font-mono text-zinc-500">
                    <div>
                        <span className="text-zinc-600 block text-[10px] uppercase">Hotspots</span>
                        <span className="text-zinc-300">{events.filter(e => e.severity > 70).length}</span>
                    </div>
                    <div>
                        <span className="text-zinc-600 block text-[10px] uppercase">Monitor</span>
                        <span className="text-zinc-300">{events.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
