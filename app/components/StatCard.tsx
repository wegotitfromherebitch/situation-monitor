
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
    label,
    value,
    trend,
    icon: Icon,
    onClick,
}: {
    label: string;
    value: string;
    trend?: { value: string; up: boolean };
    icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                "glass-panel text-left w-full rounded-2xl p-5 transition-all text-zinc-100 relative overflow-hidden group " +
                (onClick ? "glass-panel-hover cursor-pointer" : "cursor-default")
            }
            aria-label={onClick ? `Filter by ${label}` : label}
        >
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[100px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                        <Icon className="w-5 h-5" />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-md ${trend.up ? 'text-critical' : 'text-success'}`}>
                            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trend.value}
                        </div>
                    )}
                </div>

                <div>
                    <div className="text-3xl font-bold tracking-tight mb-1 font-sans">{value}</div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</div>
                </div>
            </div>

            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </button>
    );
}
