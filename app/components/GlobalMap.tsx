import { Shield } from 'lucide-react';
import { EventItem } from '../lib/events';
import { MapView } from './MapView';

interface GlobalMapProps {
    events: EventItem[];
    onEventClick?: (event: EventItem) => void;
    className?: string; // Allow external styling
    focused?: boolean;
}

export function GlobalMap({ events, onEventClick, className, focused }: GlobalMapProps) {
    return (
        <div className={`rounded-xl border border-zinc-800 bg-zinc-900/20 relative overflow-hidden flex flex-col group ${className || 'h-[600px]'}`}>


            <div className="flex-1 w-full h-full relative z-10">
                <MapView events={events} onEventClick={onEventClick} focused={focused} />
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
