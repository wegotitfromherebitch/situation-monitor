'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem } from '../lib/events';

interface IntelModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: EventItem[];
    defcon: number;
}

export function IntelModal({ isOpen, onClose, events, defcon }: IntelModalProps) {
    // Generate AI Summary
    const aiSummary = useMemo(() => {
        const critical = events.filter(e => e.severity > 60).sort((a, b) => b.severity - a.severity);
        const topDriver = critical[0];

        if (!topDriver) return "Global systems nominal. No significant threats detected.";

        return `Global Threat Level indicates elevated risk due to ${topDriver.category.toLowerCase()} instability in ${topDriver.region}. Primary driver is "${topDriver.baseTitle.toLowerCase()}" which has reached Severity ${topDriver.severity}. ${critical.length > 1 ? `Secondary conflicts detected in ${critical[1].region} exacerbate regional tensions.` : ''}`;
    }, [events]);

    const getColor = () => {
        if (defcon === 1) return { bg: 'bg-red-600', text: 'text-red-500' };
        if (defcon === 2) return { bg: 'bg-orange-500', text: 'text-orange-500' };
        if (defcon === 3) return { bg: 'bg-amber-400', text: 'text-amber-400' };
        return { bg: 'bg-emerald-500', text: 'text-emerald-500' };
    };

    const colors = getColor();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                    />

                    {/* Intel Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-[400px] bg-zinc-950 border border-zinc-700 shadow-2xl z-[101] rounded-xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className={`p-4 border-b border-zinc-800 flex justify-between items-center ${colors.bg} bg-opacity-10`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${colors.bg} animate-pulse`} />
                                <h3 className="font-bold text-zinc-100 font-mono tracking-wider">STRATEGIC ASSESSMENT</h3>
                            </div>
                            <div className={`text-2xl font-black font-mono ${colors.text}`}>
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
                                    onClick={onClose}
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
    );
}
