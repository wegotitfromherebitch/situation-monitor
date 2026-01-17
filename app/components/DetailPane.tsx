"use client";

import { useMemo } from 'react';
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
    // Memoize history data based on event id and severity
    const historyData = useMemo(() =>
        event ? generateHistory(event.severity) : [],
        [event?.id, event?.severity]);

    const title = event ? displayTitleFor(event) : '';

    return (
        <AnimatePresence>
            {event && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl z-50 overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-zinc-950/80 backdrop-blur z-10 p-6 border-b border-zinc-800 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${event.category === 'SECURITY' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    event.category === 'CYBER' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                                        event.category === 'MARKETS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                    }`}>
                                    {event.category}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono">ID: {event.id.toUpperCase()}</span>
                            </div>
                            <h2 className="text-xl font-bold text-zinc-100 leading-tight">{title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8">

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> SEVERITY
                                </div>
                                <div className="text-3xl font-mono text-zinc-100">{event.severity}<span className="text-sm text-zinc-600">/100</span></div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> MOMENTUM
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
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Situation Brief</h3>
                            <p className="text-zinc-300 leading-relaxed border-l-2 border-zinc-700 pl-4">
                                {event.summary}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2">
                                <div className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> {event.region} coordinates verified
                                </div>
                                <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Source confidence: {event.confidence}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-64 w-full bg-zinc-900/30 rounded border border-zinc-800 p-2 relative">
                            <div className="absolute top-2 left-2 text-[10px] text-zinc-500 font-mono">SEVERITY TREND (24H)</div>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px' }}
                                        itemStyle={{ color: '#e4e4e7' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={event.severity > 75 ? '#ef4444' : '#10b981'}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Protocol Actions</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <button className="w-full text-left px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all rounded flex items-center justify-between group">
                                    <span className="text-sm text-zinc-300">Generate Intelligence Report</span>
                                    <span className="text-xs text-zinc-600 group-hover:text-zinc-400">PDF</span>
                                </button>
                                <button className="w-full text-left px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all rounded flex items-center justify-between group">
                                    <span className="text-sm text-zinc-300">Share Secure Uplink</span>
                                    <span className="text-xs text-zinc-600 group-hover:text-zinc-400">ENCRYPTED</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
