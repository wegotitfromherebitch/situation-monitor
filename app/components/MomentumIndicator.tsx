import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function MomentumIndicator({ momentum }: { momentum?: "UP" | "FLAT" | "DOWN" }) {
    if (!momentum || momentum === "FLAT") {
        return <Minus className="w-3 h-3 text-zinc-500" />;
    }
    if (momentum === "UP") {
        return <TrendingUp className="w-3 h-3 text-red-400 animate-pulse" />;
    }
    return <TrendingDown className="w-3 h-3 text-emerald-400" />;
}
