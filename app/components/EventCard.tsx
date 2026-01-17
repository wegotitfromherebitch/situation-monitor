import { Shield, Globe, DollarSign, Cpu, CloudRain } from 'lucide-react';
import { type EventItem, displayTitleFor } from '../lib/events';

const categoryConfig = {
    SECURITY: { icon: Shield, label: "SEC", color: "text-red-500", border: "border-red-500/50" },
    STATE: { icon: Globe, label: "GOV", color: "text-blue-500", border: "border-blue-500/50" },
    MARKETS: { icon: DollarSign, label: "MKT", color: "text-emerald-500", border: "border-emerald-500/50" },
    CYBER: { icon: Cpu, label: "NET", color: "text-cyan-500", border: "border-cyan-500/50" },
    CLIMATE: { icon: CloudRain, label: "ENV", color: "text-amber-500", border: "border-amber-500/50" }
};

const confidenceConfig = {
    HIGH: { label: 'VERIFIED', color: 'text-emerald-500' },
    MED: { label: 'LIKELY', color: 'text-amber-500' },
    LOW: { label: 'UNCONFIRMED', color: 'text-zinc-600' },
} as const;

export function EventCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
    const config = categoryConfig[event.category];
    const CatIcon = config.icon;

    return (
        <div
            onClick={onClick}
            className="group relative border-l-2 border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/80 transition-all cursor-pointer p-3 flex flex-col gap-2 hover:border-l-4 hover:border-zinc-500"
            style={{ borderColor: event.severity > 75 ? config.color.replace('text-', '') : undefined }}
        >
            {/* Header Line: ID | TIME | CAT */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                <div className="flex items-center gap-3">
                    <span className={config.color}>{event.id}</span>
                    <span className="text-zinc-600">|</span>
                    <span>{event.updatedMinutesAgo}m ago</span>
                    <span className="text-zinc-600">|</span>
                    <span className={`flex items-center gap-1 ${config.color}`}>
                        <CatIcon className="w-3 h-3" />
                        {config.label}
                    </span>
                </div>
                {/* Severity Indicator */}
                <div className="flex items-center gap-2">
                    <span>SEV: {event.severity}</span>
                    <div className={`w-2 h-2 rounded-full ${event.severity > 75 ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`} />
                </div>
            </div>

            {/* Main Content */}
            <div className="pl-0">
                <h3 className="text-sm font-bold text-zinc-300 group-hover:text-white leading-tight mb-1">
                    {displayTitleFor(event)}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2 border-l border-zinc-800 pl-2">
                    {event.summary}
                </p>
            </div>
        </div>
    );
}
