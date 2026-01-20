'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem } from '../lib/events';

interface ThreatHeartbeatProps {
    events: EventItem[];
}

export function ThreatHeartbeat({ events }: ThreatHeartbeatProps) {
    // Calculate global threat level (0-100)
    const threatLevel = useMemo(() => {
        if (!events.length) return 0;
        const avgSeverity = events.reduce((sum, e) => sum + e.severity, 0) / events.length;
        const criticalCount = events.filter(e => e.severity > 75).length;
        // Weight critical events more heavily
        return Math.min(100, Math.round(avgSeverity + (criticalCount * 5)));
    }, [events]);

    // Determine pulse speed based on threat level
    const pulseSpeed = threatLevel > 70 ? 0.8 : threatLevel > 40 ? 1.5 : 2.5;

    // Color based on threat level
    const getColor = () => {
        if (threatLevel > 70) return { ring: 'ring-red-500', bg: 'bg-red-500', shadow: 'shadow-red-500/50' };
        if (threatLevel > 40) return { ring: 'ring-amber-500', bg: 'bg-amber-500', shadow: 'shadow-amber-500/50' };
        return { ring: 'ring-emerald-500', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' };
    };

    const colors = getColor();

    const [showIntel, setShowIntel] = useState(false);

    // Dynamic Defcon Calculation
    const defcon = useMemo(() => {
        if (threatLevel >= 80) return 1;
        if (threatLevel >= 60) return 2;
        if (threatLevel >= 40) return 3;
        if (threatLevel >= 20) return 4;
        return 5;
    }, [threatLevel]);

    // Generate AI Summary
    const aiSummary = useMemo(() => {
        const critical = events.filter(e => e.severity > 60).sort((a, b) => b.severity - a.severity);
        const topDriver = critical[0];

        if (!topDriver) return "Global systems nominal. No significant threats detected.";

        return `Global Threat Level indicates elevated risk due to ${topDriver.category.toLowerCase()} instability in ${topDriver.region}. Primary driver is "${topDriver.baseTitle.toLowerCase()}" which has reached Severity ${topDriver.severity}. ${critical.length > 1 ? `Secondary conflicts detected in ${critical[1].region} exacerbate regional tensions.` : ''}`;
    }, [events]);

    return (
        <>
            <div
                className="flex items-center gap-3 cursor-pointer group hover:bg-zinc-900/50 px-2 py-1 rounded transition-colors"
                onClick={() => setShowIntel(true)}
            >
                <div className="relative">
                    {/* Pulsing ring */}
                    <motion.div
                        animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                            duration: pulseSpeed,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className={`absolute inset-0 rounded-full ${colors.bg} opacity-60`}
                    />
                    {/* Core dot */}
                    <div className={`relative w-3 h-3 rounded-full ${colors.bg} shadow-lg ${colors.shadow}`} />
                </div>
                <div className="text-[10px] font-mono flex items-center gap-2">
                    <span className="text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">DEFCON</span>
                    <span className={`font-bold text-lg ${threatLevel > 70 ? 'text-red-500' :
                        threatLevel > 40 ? 'text-amber-500' :
                            'text-emerald-500'
                        }`}>
                        {defcon}
                    </span>
                    <span className="text-[9px] text-zinc-600 border-l border-zinc-800 pl-2 ml-1">GTL {threatLevel}</span>
                </div>
            </div>

            {/* Strategic Assessment Modal */}
            <AnimatePresence>
                {showIntel && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowIntel(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        />

                        {/* Intel Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed top-24 left-1/2 -translate-x-1/2 w-[400px] bg-zinc-950 border border-zinc-700 shadow-2xl z-[101] rounded-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className={`p-4 border-b border-zinc-800 flex justify-between items-center ${colors.bg} bg-opacity-10`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${colors.bg} animate-pulse`} />
                                    <h3 className="font-bold text-zinc-100 font-mono tracking-wider">STRATEGIC ASSESSMENT</h3>
                                </div>
                                <div className={`text-2xl font-black font-mono ${colors.bg.replace('bg-', 'text-')}`}>
                                    DEFCON {defcon}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">

                                {/* AI Summary Block */}
                                <div className="space-y-2">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                                        <span className="w-4 h-[1px] bg-zinc-600" /> AI Analysis
                                    </div>
                                    <p className="text-sm text-zinc-300 font-mono leading-relaxed border-l-2 border-zinc-800 pl-3">
                                        {aiSummary}
                                    </p>
                                </div>

                                {/* Drivers */}
                                <div className="space-y-3">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
                                        Critical Threat Drivers
                                    </div>
                                    <div className="space-y-2">
                                        {events.slice(0, 3).map(e => (
                                            <div key={e.id} className="flex items-center justify-between p-2 bg-zinc-900/50 rounded border border-zinc-800/50">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-200 font-bold">{e.baseTitle}</span>
                                                    <span className="text-[10px] text-zinc-500">{e.region}</span>
                                                </div>
                                                <div className="text-[10px] font-bold font-mono text-zinc-400">SEV {e.severity}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800 text-center">
                                    <button
                                        onClick={() => setShowIntel(false)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase font-bold tracking-widest"
                                    >
                                        Close Assessment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
