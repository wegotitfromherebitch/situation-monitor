import { Shield, Globe, DollarSign, Cpu, CloudRain } from 'lucide-react';
import { type EventItem, displayTitleFor } from '../lib/events';

const categoryConfig = {
    SECURITY: { icon: Shield, label: "Security", color: "text-red-500" },
    STATE: { icon: Globe, label: "State", color: "text-blue-500" },
    MARKETS: { icon: DollarSign, label: "Markets", color: "text-emerald-500" },
    CYBER: { icon: Cpu, label: "Cyber", color: "text-cyan-500" },
    CLIMATE: { icon: CloudRain, label: "Climate", color: "text-amber-500" }
};

export function EventCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
    const config = categoryConfig[event.category];
    const CatIcon = config.icon;

    // Severity color calculation
    const isCritical = event.severity > 75;
    const severityColor = isCritical ? 'text-red-500' :
        event.severity > 50 ? 'text-amber-500' : 'text-zinc-600';

    return (
        <div
            onClick={onClick}
            className="group relative border-b border-white/5 hover:bg-zinc-900/60 transition-all cursor-pointer py-4 px-2 first:pt-2 active:scale-[0.99]"
        >
            <div className="flex flex-col gap-1.5 group-hover:translate-x-1 transition-transform duration-300">
                {/* Meta Row: Cat • Time • Sev */}
                <div className="flex items-center justify-between text-xs mb-0.5">
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 font-medium ${config.color}`}>
                            <CatIcon className="w-3.5 h-3.5" />
                            {config.label}
                        </span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-zinc-500 font-mono text-[10px]">{event.updatedMinutesAgo}m ago</span>
                    </div>

                    <div className={`font-mono text-[10px] font-bold ${severityColor}`}>
                        SEV {event.severity}
                    </div>
                </div>

                {/* Content */}
                <div>
                    <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white leading-snug mb-1">
                        {displayTitleFor(event)}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 pr-4">
                        {event.summary}
                    </p>
                </div>
            </div>

            {/* Subtle active indicator for critical/high priority items */}
            {isCritical && (
                <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-red-500 rounded-full opacity-60" />
            )}
        </div>
    );
}
