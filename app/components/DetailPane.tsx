"use client";

import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem, displayTitleFor } from '../lib/events';
import { X, Activity, Globe, Shield, Zap, TrendingUp, TrendingDown, Minus, FileText, Radio, Loader2, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface DetailPaneProps {
    event: EventItem | null;
    onClose: () => void;
    onAction?: (action: string, event: EventItem) => void;
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

export function DetailPane({ event, onClose, onAction }: DetailPaneProps) {
    const [actionState, setActionState] = useState<{ action: string; status: 'loading' | 'done' } | null>(null);

    // Esc key listener
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (event) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [event]);

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl z-[100] overflow-y-auto"
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
                                    <span className="text-xs text-zinc-500 font-mono tracking-wider">ID:G-{event.id.toUpperCase().slice(0, 8)}</span>
                                </div>
                                <h2 className="text-xl font-bold text-zinc-100 leading-tight font-mono">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-zinc-100 group"
                            >
                                <span className="text-[10px] font-bold tracking-widest hidden group-hover:block font-mono">CLOSE</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8">

                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="hud-card hud-brackets p-4 relative">
                                    <div className="text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wider font-mono">
                                        <Activity className="w-3 h-3" /> Severity
                                    </div>
                                    <div className="text-3xl font-mono text-zinc-100 tracking-tighter">{event.severity}<span className="text-sm text-zinc-600 ml-1">/100</span></div>
                                </div>
                                <div className="hud-card hud-brackets p-4 relative">
                                    <div className="text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wider font-mono">
                                        <Zap className="w-3 h-3" /> Momentum
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`text-xl font-bold font-mono ${event.momentum === 'UP' ? 'text-red-500' :
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
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono pl-1 border-l-2 border-emerald-500/50">Event Summary</h3>
                                <div className="hud-card p-4 rounded-none border-l-2 border-zinc-700">
                                    <p className="text-zinc-300 leading-relaxed text-sm font-mono text-justify">
                                        {event.summary}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 pt-2">
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider font-mono">
                                        <Globe className="w-3.5 h-3.5 text-zinc-600" /> GEO: {event.region} confirmed
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider font-mono">
                                        <Shield className="w-3.5 h-3.5 text-zinc-600" /> CONFIDENCE: {event.confidence} (Data Active)
                                    </div>
                                </div>
                            </div>

                            {/* Source Intel Link */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono pl-1 border-l-2 border-blue-500/50">Verified Source Intel</h3>

                                {event.url ? (
                                    <div className="hud-card p-0 overflow-hidden group relative">
                                        <div className="bg-zinc-900/50 p-4 border-b border-zinc-800">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20">
                                                    <Globe className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-300 font-bold font-mono">EXTERNAL_WICKET_OPEN</span>
                                                    <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[250px]">{event.url}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-black/20 flex flex-col items-center justify-center gap-4 text-center">
                                            <p className="text-xs text-zinc-500 max-w-[80%] font-mono">
                                                Direct connection to external intelligence source established.
                                                Secure channel ready for access.
                                            </p>
                                            <button
                                                onClick={() => window.open(event.url, '_blank')}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono tracking-wider uppercase rounded transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                            >
                                                ACCESS SOURCE MATERIAL <Check className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="hud-card p-4 border-l-2 border-zinc-700 bg-zinc-900/10">
                                        <div className="flex items-center gap-3 text-zinc-500">
                                            <Shield className="w-4 h-4" />
                                            <span className="text-xs font-mono">NO EXTERNAL INTELLIGENCE LINKED</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-mono">Actions</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => {
                                            if (!event) return;
                                            setActionState({ action: 'report', status: 'loading' });
                                            setTimeout(() => {
                                                setActionState({ action: 'report', status: 'done' });
                                                onAction?.('report', event);
                                                setTimeout(() => setActionState(null), 2000);
                                            }, 1500);
                                        }}
                                        disabled={actionState?.action === 'report'}
                                        className="w-full text-left px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-zinc-700 transition-all rounded-none flex items-center justify-between group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed hud-card"
                                    >
                                        <span className="flex items-center gap-3">
                                            {actionState?.action === 'report' ? (
                                                actionState.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                            )}
                                            <span className="text-sm text-zinc-200 font-mono">GENERATE_DATA_REPORT</span>
                                        </span>
                                        <div className="px-2 py-0.5 bg-zinc-800 text-[10px] font-bold text-zinc-500 group-hover:text-zinc-100 transition-colors uppercase font-mono">
                                            {actionState?.action === 'report' && actionState.status === 'done' ? 'Ready' : 'CREATE_PDF'}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!event) return;
                                            setActionState({ action: 'uplink', status: 'loading' });
                                            setTimeout(() => {
                                                setActionState({ action: 'uplink', status: 'done' });
                                                onAction?.('uplink', event);
                                                setTimeout(() => setActionState(null), 2000);
                                            }, 1200);
                                        }}
                                        disabled={actionState?.action === 'uplink'}
                                        className="w-full text-left px-4 py-3 bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-zinc-700 transition-all rounded-none flex items-center justify-between group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed hud-card"
                                    >
                                        <span className="flex items-center gap-3">
                                            {actionState?.action === 'uplink' ? (
                                                actionState.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Radio className="w-4 h-4 text-blue-500 group-hover:text-blue-400 transition-colors" />
                                            )}
                                            <span className="text-sm text-zinc-200 font-mono">CONNECT_FEED</span>
                                        </span>
                                        <div className="px-2 py-0.5 bg-blue-500/10 text-[10px] font-bold text-blue-500 group-hover:bg-blue-500/20 transition-colors uppercase font-mono">
                                            {actionState?.action === 'uplink' && actionState.status === 'done' ? 'Connected' : 'ACTIVATE_FEED'}
                                        </div>
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
