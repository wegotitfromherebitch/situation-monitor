import { Activity } from 'lucide-react';

export function SystemStatus() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-500" />
                System Status
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Uplink Latency</span>
                    <span className="font-mono text-emerald-400">24ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Data Sources</span>
                    <span className="font-mono text-zinc-300">14/14</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Prediction Engine</span>
                    <span className="font-mono text-amber-500">CALIBRATING</span>
                </div>

                <div className="h-px bg-zinc-800 my-2" />

                <div className="text-xs text-zinc-600 leading-relaxed">
                    System operating within nominal parameters. Automated threat detection confidence at 94%.
                </div>
            </div>
        </div>
    );
}
