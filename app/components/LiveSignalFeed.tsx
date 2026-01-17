'use client';

import { useState, useRef, useEffect, useMemo, type CSSProperties } from 'react';
import { Globe, TrendingUp, TrendingDown, Zap, BadgeCheck } from 'lucide-react';
import { type EventItem, displayTitleFor } from '../lib/events';

// --- Live Signal Feed (auto-detects deltas; TweetDeck-style dopamine) ---

export type SignalType = 'escalation' | 'new' | 'deescalation' | 'verification';

export type LiveSignal = {
    id: string;
    type: SignalType;
    event: EventItem;
    delta?: number;
    ts: number; // ms timestamp
};

export function LiveSignalFeed({
    events,
    className,
    onSignal,
    mode = 'panel',
    maxCards = 5,
}: {
    events: EventItem[];
    className?: string;
    onSignal?: (signal: LiveSignal) => void;
    mode?: 'panel' | 'ticker';
    maxCards?: number;
}) {
    const [signals, setSignals] = useState<LiveSignal[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [now, setNow] = useState<number>(0);

    const feedRef = useRef<HTMLDivElement>(null);
    const prevMapRef = useRef<Map<string, EventItem>>(new Map());
    const initializedRef = useRef(false);
    const [prevTickerIds, setPrevTickerIds] = useState<string[]>([]);

    useEffect(() => {
        // Avoid calling setState synchronously
        const handle = window.setTimeout(() => setNow(Date.now()), 0);
        const t = window.setInterval(() => setNow(Date.now()), 1000);
        return () => {
            window.clearTimeout(handle);
            window.clearInterval(t);
        };
    }, []);

    const relTime = (ts: number) => {
        if (!now) return '—';
        const s = Math.max(0, Math.floor((now - ts) / 1000));
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        return `${h}h`;
    };

    const cfg = (type: SignalType) => {
        switch (type) {
            case 'escalation':
                return { icon: TrendingUp, label: 'ESCALATION', color: 'text-critical', bg: 'bg-critical/10', pulse: 'bg-critical' };
            case 'new':
                return { icon: Zap, label: 'NEW SIGNAL', color: 'text-warning', bg: 'bg-warning/10', pulse: 'bg-warning' };
            case 'deescalation':
                return { icon: TrendingDown, label: 'DEESCALATION', color: 'text-success', bg: 'bg-success/10', pulse: 'bg-success' };
            case 'verification':
                return { icon: BadgeCheck, label: 'VERIFIED', color: 'text-info', bg: 'bg-info/10', pulse: 'bg-info' };
        }
    };

    useEffect(() => {
        const prevMap = prevMapRef.current;

        if (!initializedRef.current) {
            prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
            initializedRef.current = true;
            return;
        }

        if (isPaused) {
            prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
            return;
        }

        const newSignals: LiveSignal[] = [];

        for (const e of events) {
            const prev = prevMap.get(e.id);
            if (!prev) {
                newSignals.push({ id: `${e.id}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: 'new', event: e, ts: Date.now() });
                continue;
            }

            const delta = e.severity - prev.severity;
            if (delta >= 5) {
                newSignals.push({ id: `${e.id}-esc-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: 'escalation', event: e, delta, ts: Date.now() });
            } else if (delta <= -5) {
                newSignals.push({ id: `${e.id}-deesc-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: 'deescalation', event: e, delta, ts: Date.now() });
            }

            const confUp = (prev.confidence === 'LOW' && (e.confidence === 'MED' || e.confidence === 'HIGH')) || (prev.confidence === 'MED' && e.confidence === 'HIGH');
            if (confUp) {
                newSignals.push({ id: `${e.id}-ver-${Date.now()}-${Math.random().toString(16).slice(2)}`, type: 'verification', event: e, ts: Date.now() });
            }
        }

        if (newSignals.length) {
            const pri = (t: SignalType) => (t === 'escalation' ? 0 : t === 'new' ? 1 : t === 'verification' ? 2 : 3);
            newSignals.sort((a, b) => pri(a.type) - pri(b.type));
            const batch = newSignals.slice(0, 3);

            if (batch[0]) onSignal?.(batch[0]);

            window.setTimeout(() => {
                setSignals((cur) => [...batch, ...cur].slice(0, 25));
            }, 0);
        }

        prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
    }, [events, isPaused, onSignal]);

    const ticker = useMemo(() => signals.slice(0, maxCards), [signals, maxCards]);
    const tickerIds = useMemo(() => ticker.map((s) => s.id), [ticker]);

    // Stable string key 
    const tickerIdsKey = useMemo(() => tickerIds.join('|'), [tickerIds]);

    const CARD_W = 280; // px
    const GAP = 12; // px

    useEffect(() => {
        const t = window.setTimeout(() => {
            setPrevTickerIds((prev) => {
                if (prev.join('|') === tickerIdsKey) return prev;
                return tickerIds;
            });
        }, 0);
        return () => window.clearTimeout(t);
    }, [tickerIdsKey, tickerIds]);

    if (mode === 'ticker') {
        return (
            <div className={`${className ?? ''} w-full`} aria-label="Live signal ticker">
                <div className="glass-panel rounded-2xl overflow-hidden p-1">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl mb-1">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPaused ? 'bg-zinc-500' : 'bg-success'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-zinc-500' : 'bg-success'}`}></span>
                            </div>
                            <div className="text-[10px] tracking-[0.2em] font-bold text-zinc-400">LIVE FEED</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPaused((p) => !p)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>
                    </div>

                    <div className="relative h-[80px] w-full overflow-hidden">
                        {ticker.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600 font-medium">
                                Waiting for signal acquisition...
                            </div>
                        ) : (
                            <div className="relative h-full pl-2">
                                {ticker.map((s, idx) => {
                                    const c = cfg(s.type);
                                    const Icon = c.icon;
                                    const x = idx * (CARD_W + GAP);
                                    const isNew = !prevTickerIds.includes(s.id);
                                    const enterDelayMs = Math.min(120, idx * 28);
                                    const cardStyle: CSSProperties & { ['--ticker-x']: string } = {
                                        width: CARD_W,
                                        top: '50%',
                                        transform: `translate(${x}px, -50%)`,
                                        ['--ticker-x']: `${x}px`,
                                        transition: 'transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 300ms ease',
                                        animation: isNew ? `tickerIn 300ms cubic-bezier(0.2, 0.8, 0.2, 1) ${enterDelayMs}ms both` : undefined,
                                    };

                                    return (
                                        <div
                                            key={s.id}
                                            className="absolute left-0 rounded-xl bg-surface-elevated border border-white/5 overflow-hidden shadow-lg backdrop-blur-md"
                                            style={cardStyle}
                                        >
                                            <div className="p-3 relative">
                                                {/* Side Accent Line */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.pulse}`} />

                                                <div className="flex items-start justify-between gap-3 pl-3">
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <div className="p-1.5 rounded-lg bg-white/5">
                                                            <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className={`text-[9px] font-bold tracking-widest ${c.color}`}>{c.label}</span>
                                                                {typeof s.delta === 'number' && (
                                                                    <span className={`text-[9px] font-mono ${c.color}`}>{s.delta > 0 ? '+' : ''}{s.delta}</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-zinc-100 font-medium leading-tight truncate">{displayTitleFor(s.event)}</div>
                                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                                                                <span>{s.event.region}</span>
                                                                <span className="text-zinc-700">•</span>
                                                                <span className={c.color}>{relTime(s.ts)} ago</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Fade Edges */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/80 to-transparent" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null; // We only support ticker mode for now in this redesign
}
