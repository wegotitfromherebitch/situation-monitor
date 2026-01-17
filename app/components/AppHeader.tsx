import { Search, Activity } from 'lucide-react';

interface AppHeaderProps {
    ticks: number;
}

export function AppHeader({ ticks }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-sm bg-gradient-to-tr from-emerald-500 to-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                    <h1 className="font-bold text-lg tracking-tight text-zinc-100">
                        SITUATION<span className="text-zinc-600">MONITOR</span>
                    </h1>
                    <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-950/30 border border-emerald-900/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-medium text-emerald-500">LIVE</span>
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-6 hidden md:block">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Query live intel..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-1.5 pl-9 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" />
                        <span>NET: STABLE</span>
                    </div>
                    <div className="hidden sm:block text-zinc-700">|</div>
                    <div className="hidden sm:block">
                        {ticks > 0 ? `${ticks}s since sync` : 'Syncing...'}
                    </div>
                </div>
            </div>
        </header>
    );
}
