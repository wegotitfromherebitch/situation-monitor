import { Shield, Globe, DollarSign, BadgeCheck, CircleDashed, Clock, ChevronRight, Cpu, CloudRain } from 'lucide-react';
import { type EventItem, displayTitleFor } from '../lib/events';
import { SeverityBar } from './SeverityBar';
import { MomentumIndicator } from './MomentumIndicator';

const categoryConfig = {
    SECURITY: { icon: Shield, label: "Security", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    STATE: { icon: Globe, label: "State", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    MARKETS: { icon: DollarSign, label: "Markets", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    CYBER: { icon: Cpu, label: "Cyber", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    CLIMATE: { icon: CloudRain, label: "Climate", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
};

const confidenceConfig = {
    HIGH: { label: 'VERIFIED', color: 'text-success', icon: BadgeCheck },
    MED: { label: 'LIKELY', color: 'text-warning', icon: CircleDashed },
    LOW: { label: 'UNCONFIRMED', color: 'text-zinc-500', icon: CircleDashed },
} as const;

export function EventCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
    const CategoryIcon = categoryConfig[event.category].icon;
    const config = categoryConfig[event.category];

    const getSeverityLabel = () => {
        if (event.severity >= 80) return { label: 'CRITICAL', color: 'text-critical' };
        if (event.severity >= 60) return { label: 'ELEVATED', color: 'text-warning' };
        if (event.severity >= 40) return { label: 'WATCH', color: 'text-caution' };
        return { label: 'MONITOR', color: 'text-success' };
    };

    const severityInfo = getSeverityLabel();
    const conf = confidenceConfig[event.confidence];
    const ConfIcon = conf.icon;

    return (
        <div
            onClick={onClick}
            className="glass-panel glass-panel-hover group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300"
        >
            {/* Dynamic Glow Background */}
            <div
                className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-colors duration-700
          ${event.severity >= 80 ? 'bg-critical' : event.severity >= 60 ? 'bg-warning' : 'bg-success'}`}
            />

            <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/5 border border-white/5 shadow-inner`}>
                            <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">{event.category}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-zinc-300">{event.region}</span>
                                <MomentumIndicator momentum={event.momentum} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                        <div className={`w-1.5 h-1.5 rounded-full ${event.updatedMinutesAgo < 5 ? 'animate-pulse bg-success' : 'bg-zinc-600'}`} />
                        <span className="text-[11px] font-medium text-zinc-400 font-mono">{event.updatedMinutesAgo}m</span>
                    </div>
                </div>

                {/* Content */}
                <h3 className="text-zinc-100 font-semibold text-lg mb-2 leading-tight tracking-tight group-hover:text-white transition-colors">
                    {displayTitleFor(event)}
                </h3>

                <p className="text-zinc-400 text-sm mb-5 leading-relaxed line-clamp-2 font-light tracking-wide">
                    {event.summary}
                </p>

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-mono font-bold ${severityInfo.color}`}>SEV {event.severity}</span>
                            <div className="w-16">
                                <SeverityBar severity={event.severity} />
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wide ${conf.color}`}>
                        <ConfIcon className="w-3.5 h-3.5" />
                        {conf.label}
                    </div>
                </div>
            </div>
        </div>
    );
}
