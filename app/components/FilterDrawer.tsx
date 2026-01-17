'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, AlertTriangle, Shield, Clock, Filter } from 'lucide-react';
import { EventItem, displayTitleFor } from '../lib/events';
import { sevTier } from '../lib/simulation';

export type FilterType = 'all' | 'critical' | 'active' | 'high-confidence' | null;

interface FilterDrawerProps {
    filter: FilterType;
    events: EventItem[];
    onClose: () => void;
    onEventClick: (event: EventItem) => void;
}

const filterConfig = {
    all: { icon: Activity, label: 'All Signals', color: 'text-emerald-500', bg: 'bg-emerald-500' },
    critical: { icon: AlertTriangle, label: 'Critical Threats', color: 'text-red-500', bg: 'bg-red-500' },
    active: { icon: Clock, label: '24h Active', color: 'text-amber-500', bg: 'bg-amber-500' },
    'high-confidence': { icon: Shield, label: 'High Confidence', color: 'text-blue-500', bg: 'bg-blue-500' },
};

export function FilterDrawer({ filter, events, onClose, onEventClick }: FilterDrawerProps) {
    if (!filter) return null;

    const config = filterConfig[filter];
    const Icon = config.icon;

    // Filter events based on the selected filter
    const filteredEvents = events.filter((e) => {
        switch (filter) {
            case 'all':
                return true;
            case 'critical':
                return sevTier(e.severity) === 'CRITICAL';
            case 'active':
                return e.updatedMinutesAgo < 24 * 60;
            case 'high-confidence':
                return e.confidence === 'HIGH';
            default:
                return true;
        }
    });

    return (
        <AnimatePresence>
            {filter && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 right-0 max-h-[70vh] bg-zinc-950/95 backdrop-blur-2xl border-b border-white/5 shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${config.bg}/10`}>
                                    <Icon className={`w-6 h-6 ${config.color}`} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-100">{config.label}</h2>
                                    <p className="text-sm text-zinc-500 font-mono">
                                        {filteredEvents.length} signal{filteredEvents.length !== 1 ? 's' : ''} detected
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-zinc-100"
                            >
                                <span className="text-xs font-bold tracking-widest">CLOSE</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Event Grid */}
                        <div className="p-6 overflow-y-auto max-h-[calc(70vh-100px)] custom-scrollbar">
                            {filteredEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                                    <Filter className="w-12 h-12 mb-4 opacity-50" />
                                    <p className="text-sm font-medium">No signals match this filter</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredEvents.map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={() => {
                                                onEventClick(event);
                                                onClose();
                                            }}
                                            className="text-left p-4 bg-zinc-900/40 border border-white/5 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 transition-all group active:scale-[0.98]"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${event.category === 'SECURITY' ? 'bg-red-500/10 text-red-500' :
                                                        event.category === 'CYBER' ? 'bg-cyan-500/10 text-cyan-500' :
                                                            event.category === 'MARKETS' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                event.category === 'CLIMATE' ? 'bg-amber-500/10 text-amber-500' :
                                                                    'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {event.category}
                                                </span>
                                                <span className={`text-xs font-mono font-bold ${event.severity > 75 ? 'text-red-500' :
                                                        event.severity > 50 ? 'text-amber-500' :
                                                            'text-zinc-600'
                                                    }`}>
                                                    SEV {event.severity}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white mb-1 line-clamp-1">
                                                {displayTitleFor(event)}
                                            </h3>
                                            <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
                                                {event.summary}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-wider">
                                                <span>{event.region}</span>
                                                <span>•</span>
                                                <span>{event.updatedMinutesAgo}m ago</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
