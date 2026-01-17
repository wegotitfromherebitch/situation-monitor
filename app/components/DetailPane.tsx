"use client";

import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem, displayTitleFor } from '../lib/events';
import { X, Activity, Globe, Shield, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface DetailPaneProps {
    event: EventItem | null;
    onClose: () => void;
}

// Generate dummy history data based on severity
const generateHistory = (severity: number) => {
    const data = [];
    let current = severity;
    for (let i = 0; i < 20; i++) {
        current = current + (Math.random() * 10 - 5);
        if (current > 100) current = 100;
        if (current < 0) current = 0;
        data.push({ time: i, value: Math.round(current) });
    }
    return data;
};

export function DetailPane({ event, onClose }: DetailPaneProps) {
    // Esc key listener
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Memoize history data based on event id and severity
    const historyData = useMemo(() =>
        event ? generateHistory(event.severity) : [],
        [event?.id, event?.severity]);

    const title = event ? displayTitleFor(event) : '';

    return (
        <AnimatePresence>
            {event && (
                <>
                    {/* Backdrop for click-to-close */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10 p-6 border-b border-white/5 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold font-mono rounded border ${event.category === 'SECURITY' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        event.category === 'CYBER' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                                            event.category === 'MARKETS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                        }`}>
                                        {event.category}
                                    </span>
                                    <span className="text-xs text-zinc-600 font-mono">SIGNAL_ID: {event.id.toUpperCase()}</span>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-100 leading-tight">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-zinc-100 group"
                            >
                                <span className="text-[10px] font-bold tracking-widest hidden group-hover:block">CLOSE</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8">

                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
                                        <Activity className="w-3 h-3" /> Severity Index
                                    </div>
                                    <div className="text-3xl font-mono text-zinc-100">{event.severity}<span className="text-sm text-zinc-700 ml-1">/100</span></div>
                                </div>
                                <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wider">
                                        <Zap className="w-3 h-3" /> Momentum
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`text-xl font-bold ${event.momentum === 'UP' ? 'text-red-500' :
                                            event.momentum === 'DOWN' ? 'text-emerald-500' :
                                                'text-zinc-400'
                                            }`}>
                                            {event.momentum}
                                        </div>
                                        {event.momentum === 'UP' && <TrendingUp className="w-5 h-5 text-red-500" />}
                                        {event.momentum === 'DOWN' && <TrendingDown className="w-5 h-5 text-emerald-500" />}
                                        {(!event.momentum || event.momentum === 'FLAT') && <Minus className="w-5 h-5 text-zinc-400" />}
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Block */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Situation Brief</h3>
                                <p className="text-zinc-300 leading-relaxed text-sm bg-zinc-900/20 p-4 rounded-lg border-l-2 border-zinc-700">
                                    {event.summary}
                                </p>
                                <div className="flex flex-col gap-2 pt-2">
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                        <Globe className="w-3.5 h-3.5 text-zinc-600" /> Geospatial: {event.region} confirmed
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                        <Shield className="w-3.5 h-3.5 text-zinc-600" /> Trust Score: {event.confidence} (Sync Active)
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-64 w-full bg-zinc-900/20 rounded-xl border border-white/5 p-4 relative">
                                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-4">Propagation Curve (24h)</div>
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={historyData}>
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px', borderRadius: '8px' }}
                                            itemStyle={{ color: '#e4e4e7' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={event.severity > 75 ? '#ef4444' : event.severity > 50 ? '#f59e0b' : '#10b981'}
                                            strokeWidth={2.5}
                                            dot={false}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Protocol Actions</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <button className="w-full text-left px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-zinc-700 transition-all rounded-xl flex items-center justify-between group active:scale-[0.98]">
                                        <span className="text-sm text-zinc-200">Generate Intelligence Report</span>
                                        <div className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-500 group-hover:text-zinc-100 transition-colors uppercase">Execute.pdf</div>
                                    </button>
                                    <button className="w-full text-left px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-zinc-700 transition-all rounded-xl flex items-center justify-between group active:scale-[0.98]">
                                        <span className="text-sm text-zinc-200">Signal Relay Uplink</span>
                                        <div className="px-2 py-0.5 rounded bg-blue-500/10 text-[10px] font-bold text-blue-500 group-hover:bg-blue-500/20 transition-colors uppercase">Secure</div>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
