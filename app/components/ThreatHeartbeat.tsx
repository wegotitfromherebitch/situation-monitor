'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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

    return (
        <div className="flex items-center gap-3">
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
            <div className="text-[10px] font-mono">
                <span className="text-zinc-600 uppercase tracking-wider">GTL</span>
                <span className={`ml-1.5 font-bold ${threatLevel > 70 ? 'text-red-500' :
                        threatLevel > 40 ? 'text-amber-500' :
                            'text-emerald-500'
                    }`}>
                    {threatLevel}
                </span>
            </div>
        </div>
    );
}
