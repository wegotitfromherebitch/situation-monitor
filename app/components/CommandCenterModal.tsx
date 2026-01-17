"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { EventItem, displayTitleFor } from '../lib/events';
import { X, Globe, Shield, Activity, Zap, ExternalLink, MapPin } from 'lucide-react';
import { MapView } from './MapView';
import { useState, useEffect } from 'react';

interface CommandCenterModalProps {
    event: EventItem | null;
    onClose: () => void;
}

export function CommandCenterModal({ event, onClose }: CommandCenterModalProps) {
    const [currentTime, setCurrentTime] = useState<string>("");

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Esc key listener
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!event) return null;

    const title = displayTitleFor(event);

    // Determine color theme based on severity
    const isCritical = event.severity > 75;
    const themeColor = isCritical ? 'red' : event.severity > 50 ? 'amber' : 'emerald';
    const borderColor = isCritical ? 'border-red-500/30' : event.severity > 50 ? 'border-amber-500/30' : 'border-emerald-500/30';
    const bgColor = isCritical ? 'bg-red-500/10' : event.severity > 50 ? 'bg-amber-500/10' : 'bg-emerald-500/10';
    const textColor = isCritical ? 'text-red-500' : event.severity > 50 ? 'text-amber-500' : 'text-emerald-500';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 sm:p-8"
            >
                {/* Main Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="w-full max-w-7xl h-full max-h-[90vh] bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

                    {/* Header */}
                    <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 bg-zinc-900/40">
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <div>
                                <h1 className="text-sm font-bold tracking-[0.3em] text-zinc-400 uppercase font-mono">Mission Control // Priority Thread</h1>
                                <div className="text-2xl font-bold text-white tracking-widest font-mono">CRITICAL INCIDENT RESPONSE</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">System Time</div>
                                <div className="text-xl font-mono text-zinc-300 font-bold">{currentTime} UTC</div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors text-zinc-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">

                        {/* Left: Map Visualization */}
                        <div className="lg:col-span-2 relative border-r border-white/5 bg-zinc-900/20">
                            <div className="absolute top-4 left-4 z-20 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-3 py-1.5 rounded text-xs font-mono text-zinc-400">
                                <span className="text-zinc-500 mr-2">TARGET LOCK:</span>
                                <span className="text-white">{event.region.toUpperCase()}</span>
                            </div>
                            <MapView
                                events={[event]}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Right: Intel & Actions */}
                        <div className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-sm overflow-y-auto custom-scrollbar">

                            {/* Threat Score Header */}
                            <div className={`p-8 border-b ${borderColor} ${bgColor}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-950/70 font-mono mix-blend-screen">
                                        <Activity className="w-4 h-4" /> Threat Assessment
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${borderColor} text-zinc-900 font-mono bg-white/20`}>
                                        {event.category}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-7xl font-black tracking-tighter ${textColor} font-mono`}>
                                        {event.severity}
                                    </span>
                                    <span className="text-xl font-bold text-zinc-500 font-mono">/100</span>
                                </div>
                                <div className="mt-2 h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${event.severity}%` }}
                                    />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-8 space-y-8 flex-1">

                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">Incident Report</h3>
                                    <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{title}</h2>
                                    <p className="text-zinc-400 leading-relaxed font-mono text-sm border-l-2 border-zinc-700 pl-4">
                                        {event.summary}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
                                            <Globe className="w-3 h-3" /> Region
                                        </div>
                                        <div className="text-zinc-200 font-medium">{event.region}</div>
                                    </div>
                                    <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
                                            <Shield className="w-3 h-3" /> Confidence
                                        </div>
                                        <div className="text-zinc-200 font-medium">{event.confidence}</div>
                                    </div>
                                    <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800 col-span-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">
                                            <MapPin className="w-3 h-3" /> Coordinates
                                        </div>
                                        <div className="text-zinc-200 font-mono text-xs">
                                            LAT: {event.coordinates[0]?.toFixed(4)} // LON: {event.coordinates[1]?.toFixed(4)}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Action Footer */}
                            <div className="p-8 border-t border-white/5 bg-zinc-900/20 mt-auto">
                                <button
                                    onClick={() => event.url && window.open(event.url, '_blank')}
                                    disabled={!event.url}
                                    className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-bold tracking-wider uppercase transition-all transform active:scale-[0.98] ${event.url
                                            ? `bg-gradient-to-r ${isCritical ? 'from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-900/20' : 'from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-900/20'} text-white`
                                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        }`}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    {event.url ? 'Access Live Intelligence Feed' : 'No External Uplink'}
                                </button>
                                <div className="text-center mt-3">
                                    <span className="text-[10px] text-zinc-600 font-mono">SECURE CONNECTION ESTABLISHED // ENCRYPTED</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
