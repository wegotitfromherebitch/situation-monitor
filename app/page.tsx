"use client";

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode, type CSSProperties } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Globe, DollarSign, Search, ChevronRight, Activity, Clock, Zap, BadgeCheck, CircleDashed } from 'lucide-react';
import { EVENTS, type EventItem, type Category, displayTitleFor } from './lib/events';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sevTier(sev: number): 'CRITICAL' | 'ELEVATED' | 'WATCH' | 'MONITOR' {
  if (sev >= 80) return 'CRITICAL';
  if (sev >= 60) return 'ELEVATED';
  if (sev >= 40) return 'WATCH';
  return 'MONITOR';
}

function momentumForDelta(delta: number): "UP" | "FLAT" | "DOWN" {
  if (delta >= 6) return "UP";
  if (delta <= -6) return "DOWN";
  return "FLAT";
}

function jitterSummary(base: string) {
  const tails = [
    "Signal density shifting.",
    "Cross-source correlation pending.",
    "Verification in progress.",
    "Secondary indicators confirming.",
    "Noise floor elevated; filter tightening.",
  ];
  return `${base} ${tails[Math.floor(Math.random() * tails.length)]}`;
}

function generateNewEvent(seed: number): EventItem {
  const regions = ["Middle East", "Eastern Europe", "South America", "Asia Pacific", "Global", "Africa", "North America"];
  const cats: Category[] = ["SECURITY", "STATE", "MARKETS"];
  const baseTitles = {
    SECURITY: ["Airspace activity", "Maritime posture", "Border friction", "Kinetic chatter"],
    STATE: ["Leadership contest", "Diplomatic rupture", "Sanctions pressure", "Election volatility"],
    MARKETS: ["Rates repricing", "Energy volatility", "FX stress", "Credit widening"],
  } as const;
  const confidences: Array<EventItem["confidence"]> = ["LOW", "MED", "HIGH"];

  const category = cats[seed % cats.length];
  const region = regions[(seed * 7) % regions.length];
  const baseTitle = baseTitles[category][(seed * 3) % baseTitles[category].length];
  const severity = clamp(42 + (seed % 45), 35, 92);
  const confidence = confidences[(seed * 5) % confidences.length];

  return {
    id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    category,
    baseTitle,
    momentum: "UP",
    region,
    summary: jitterSummary("Fresh signal detected across monitored channels."),
    severity,
    confidence,
    updatedMinutesAgo: 0,
  };
}

function simulateSync(prev: EventItem[], tick: number): EventItem[] {
  const aged = prev.map((e) => ({ ...e, updatedMinutesAgo: e.updatedMinutesAgo + 1 }));

  const count = Math.random() < 0.35 ? 2 : 1;
  const idxs: number[] = [];
  while (idxs.length < count && idxs.length < aged.length) {
    const i = Math.floor(Math.random() * aged.length);
    if (!idxs.includes(i)) idxs.push(i);
  }

  const mutated = aged.map((e, i) => {
    if (!idxs.includes(i)) return e;
    const delta = Math.round((Math.random() * 14 - 6));
    const nextSev = clamp(e.severity + delta, 20, 98);
    const nextMomentum = momentumForDelta(delta);

    let nextConfidence: EventItem["confidence"] = e.confidence;
    if (Math.random() < 0.10) {
      nextConfidence = e.confidence === "LOW" ? "MED" : e.confidence === "MED" ? "HIGH" : "MED";
    }

    return {
      ...e,
      severity: nextSev,
      momentum: nextMomentum,
      confidence: nextConfidence,
      summary: Math.random() < 0.25 ? jitterSummary(e.summary) : e.summary,
      updatedMinutesAgo: Math.min(e.updatedMinutesAgo, 6),
    };
  });

  const addNew = tick > 0 && tick % 5 === 0;
  if (addNew) {
    return [generateNewEvent(tick), ...mutated].slice(0, 28);
  }

  return mutated;
}


const categoryConfig = {
  SECURITY: { icon: Shield, label: "Security", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  STATE: { icon: Globe, label: "State", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  MARKETS: { icon: DollarSign, label: "Markets", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
};

const confidenceConfig = {
  HIGH: { label: 'VERIFIED', color: 'text-emerald-400', icon: BadgeCheck },
  MED: { label: 'LIKELY', color: 'text-amber-400', icon: CircleDashed },
  LOW: { label: 'UNCONFIRMED', color: 'text-zinc-400', icon: CircleDashed },
} as const;

function SeverityBar({ severity }: { severity: number }) {
  const getColor = () => {
    if (severity >= 80) return 'bg-gradient-to-r from-red-500 to-red-400';
    if (severity >= 60) return 'bg-gradient-to-r from-orange-500 to-amber-400';
    if (severity >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
  };
  
  return (
    <div className="h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden">
      <div 
        className={`h-full ${getColor()} transition-all duration-700`}
        style={{ width: `${severity}%` }}
      />
    </div>
  );
}

function MomentumIndicator({ momentum }: { momentum?: "UP" | "FLAT" | "DOWN" }) {
  if (!momentum || momentum === "FLAT") {
    return <Minus className="w-3 h-3 text-zinc-500" />;
  }
  if (momentum === "UP") {
    return <TrendingUp className="w-3 h-3 text-red-400 animate-pulse" />;
  }
  return <TrendingDown className="w-3 h-3 text-emerald-400" />;
}

function EventCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
  const CategoryIcon = categoryConfig[event.category].icon;
  const config = categoryConfig[event.category];

  const getSeverityLabel = () => {
    if (event.severity >= 80) return { label: 'CRITICAL', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (event.severity >= 60) return { label: 'ELEVATED', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    if (event.severity >= 40) return { label: 'WATCH', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    return { label: 'MONITOR', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const severityInfo = getSeverityLabel();
  const conf = confidenceConfig[event.confidence];
  const ConfIcon = conf.icon;

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 cursor-pointer transition-all hover:bg-zinc-900/60 hover:shadow-lg"
    >
      {/* Severity accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5">
        <SeverityBar severity={event.severity} />
      </div>

      <div className="flex items-start justify-between mb-3 mt-1">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${config.bg} ${config.border} border`}>
            <CategoryIcon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <MomentumIndicator momentum={event.momentum} />
            <span className="text-xs text-zinc-500 font-mono">{event.region}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-xs text-zinc-500 font-mono">{event.updatedMinutesAgo}m</span>
        </div>
      </div>

      <h3 className="text-zinc-100 font-medium mb-2 leading-tight group-hover:text-white transition-colors">
        {displayTitleFor(event)}
      </h3>

      <p className="text-zinc-400 text-sm mb-3 line-clamp-2 leading-relaxed">
        {event.summary}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded border font-mono ${severityInfo.color}`}>
            {event.severity} · {severityInfo.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs ${conf.color} font-mono`}>
            <ConfIcon className="w-3 h-3" />
            {conf.label}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string;
  trend?: { value: string; up: boolean };
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left w-full bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 transition-all " +
        (onClick ? "hover:border-zinc-700 hover:bg-zinc-900/55 hover:shadow-lg cursor-pointer" : "cursor-default")
      }
      aria-label={onClick ? `Filter by ${label}` : label}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.up ? 'text-red-400' : 'text-emerald-400'}`}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-zinc-100 mb-1">{value}</div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
    </button>
  );
}

function RiskGauge({ severity }: { severity: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(severity), 100);
    return () => clearTimeout(timer);
  }, [severity]);
  
  const getColor = () => {
    if (severity >= 80) return { stroke: 'stroke-red-500', text: 'text-red-400', label: 'CRITICAL' };
    if (severity >= 60) return { stroke: 'stroke-orange-500', text: 'text-orange-400', label: 'ELEVATED' };
    if (severity >= 40) return { stroke: 'stroke-yellow-500', text: 'text-yellow-400', label: 'WATCH' };
    return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', label: 'NOMINAL' };
  };
  
  const color = getColor();
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (displayValue / 100) * circumference;
  
  return (
    <div className="relative w-32 h-32">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-zinc-800"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className={`${color.stroke} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-3xl font-bold ${color.text}`}>{Math.round(displayValue)}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{color.label}</div>
      </div>
    </div>
  );
}


type ToastTone = 'neutral' | 'danger' | 'good';
type ToastItem = { id: string; title: string; message?: string; tone: ToastTone };

function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 left-5 z-[60] flex w-[360px] max-w-[92vw] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={
            "rounded-xl border bg-zinc-950/70 backdrop-blur px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] " +
            (t.tone === 'danger'
              ? 'border-red-500/25'
              : t.tone === 'good'
                ? 'border-emerald-500/25'
                : 'border-zinc-800')
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-zinc-500">
                <span
                  className={
                    "inline-flex h-2 w-2 rounded-full " +
                    (t.tone === 'danger'
                      ? 'bg-red-500 animate-pulse'
                      : t.tone === 'good'
                        ? 'bg-emerald-500'
                        : 'bg-zinc-500')
                  }
                />
                <span>{t.title}</span>
                <span className="text-zinc-700">•</span>
                <span className="font-mono text-zinc-500">LIVE</span>
              </div>
              {t.message && (
                <div className="mt-1 text-sm text-zinc-200 leading-snug line-clamp-2">{t.message}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="text-zinc-600 hover:text-zinc-300 text-lg leading-none"
              aria-label="Dismiss"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Live Signal Feed (auto-detects deltas; TweetDeck-style dopamine) ---

type SignalType = 'escalation' | 'new' | 'deescalation' | 'verification';

type LiveSignal = {
  id: string;
  type: SignalType;
  event: EventItem;
  delta?: number;
  ts: number; // ms timestamp
};

function LiveSignalFeed({
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
  const [now, setNow] = useState<number>(0); // set on client to avoid hydration mismatch

  const feedRef = useRef<HTMLDivElement>(null);
  const prevMapRef = useRef<Map<string, EventItem>>(new Map());
  const initializedRef = useRef(false);
  const [prevTickerIds, setPrevTickerIds] = useState<string[]>([]);

  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
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
        return { icon: TrendingUp, label: 'ESCALATION', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', pulse: 'bg-red-500' };
      case 'new':
        return { icon: Zap, label: 'NEW SIGNAL', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', pulse: 'bg-amber-500' };
      case 'deescalation':
        return { icon: TrendingDown, label: 'DEESCALATION', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', pulse: 'bg-emerald-500' };
      case 'verification':
        return { icon: BadgeCheck, label: 'VERIFIED', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', pulse: 'bg-blue-500' };
    }
  };

  useEffect(() => {
    const prevMap = prevMapRef.current;

    // First run: seed snapshot, don’t backfill the entire feed
    if (!initializedRef.current) {
      prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
      initializedRef.current = true;
      return;
    }

    if (isPaused) {
      // keep snapshot fresh while paused
      prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
      return;
    }

    const newSignals: LiveSignal[] = [];

    for (const e of events) {
      const prev = prevMap.get(e.id);

      if (!prev) {
        newSignals.push({
          id: `${e.id}-new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'new',
          event: e,
          ts: Date.now(),
        });
        continue;
      }

      const delta = e.severity - prev.severity;

      if (delta >= 5) {
        newSignals.push({
          id: `${e.id}-esc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'escalation',
          event: e,
          delta,
          ts: Date.now(),
        });
      } else if (delta <= -5) {
        newSignals.push({
          id: `${e.id}-deesc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'deescalation',
          event: e,
          delta,
          ts: Date.now(),
        });
      }

      const confUp =
        (prev.confidence === 'LOW' && (e.confidence === 'MED' || e.confidence === 'HIGH')) ||
        (prev.confidence === 'MED' && e.confidence === 'HIGH');

      if (confUp) {
        newSignals.push({
          id: `${e.id}-ver-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'verification',
          event: e,
          ts: Date.now(),
        });
      }
    }

    if (newSignals.length) {
      // urgency ordering + keep it compact
      const pri = (t: SignalType) => (t === 'escalation' ? 0 : t === 'new' ? 1 : t === 'verification' ? 2 : 3);
      newSignals.sort((a, b) => pri(a.type) - pri(b.type));
      const batch = newSignals.slice(0, 3);

      // Let the map react to the highest-priority signal (tasteful pulse)
      if (batch[0]) onSignal?.(batch[0]);

      setSignals((cur) => [...batch, ...cur].slice(0, 25));
      requestAnimationFrame(() => {
        const el = feedRef.current;
        if (!el) return;

        // Only auto-scroll if user is already near the top
        if (el.scrollTop < 24) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
  }, [events, isPaused, onSignal]);

  const ticker = signals.slice(0, maxCards);
  const tickerIds = useMemo(() => ticker.map((s) => s.id), [ticker]);
  const CARD_W = 280; // px
  const GAP = 10; // px
  // Used to animate only newly-entering ticker cards (tasteful slide-in)
  useEffect(() => {
    setPrevTickerIds(tickerIds);
  }, [tickerIds]);

  if (mode === 'ticker') {
    return (
      <div className={`${className ?? ''} w-full`}
        aria-label="Live signal ticker"
      >
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-[10px] tracking-[0.26em] text-zinc-500">LIVE FEED</div>
              <div className="text-[10px] text-zinc-600 font-mono">{ticker.length}/{maxCards}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? 'bg-zinc-500' : 'bg-emerald-500 animate-pulse'}`} />
                {isPaused ? 'PAUSED' : 'STREAMING'}
              </div>
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="px-2.5 py-1 rounded text-[10px] font-mono border border-zinc-800/80 bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
              >
                {isPaused ? 'RESUME' : 'PAUSE'}
              </button>
            </div>
          </div>

          <div className="relative h-[80px] px-3 py-2 overflow-hidden">
            {ticker.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-600 text-sm">Monitoring for changes…</div>
            ) : (
              <div className="relative h-full">
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
                    transition: 'transform 260ms ease, opacity 260ms ease',
                    animation: isNew ? `tickerIn 220ms ease-out ${enterDelayMs}ms both` : undefined,
                  };

                  return (
                    <div
                      key={s.id}
                      className={`absolute left-0 rounded-lg border ${c.bg} ${c.border} shadow-[0_0_0_1px_rgba(255,255,255,0.03)]`}
                      style={cardStyle}
                    >
                      <div className="p-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="p-1.5 rounded bg-zinc-950/50">
                              <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-mono tracking-wider ${c.color}`}>{c.label}</span>
                                {typeof s.delta === 'number' && (
                                  <span className={`text-[10px] font-mono ${c.color}`}>{s.delta > 0 ? '+' : ''}{s.delta}</span>
                                )}
                                <span className="text-[10px] text-zinc-700">•</span>
                                <span className="text-[10px] text-zinc-500 font-mono truncate">{s.event.region}</span>
                              </div>
                              <div className="text-[12px] text-zinc-200 leading-tight truncate">{displayTitleFor(s.event)}</div>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                <span>SEV {s.event.severity}</span>
                                <span className="text-zinc-700">•</span>
                                <span className={c.color}>{relTime(s.ts)} ago</span>
                              </div>
                            </div>
                          </div>
                          <div className={`h-2 w-2 rounded-full ${c.pulse} animate-pulse`} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Fade edges for a clean ticker window */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-zinc-950/90 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-950/90 to-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: existing panel mode
  return (
    <div className={`${className ?? 'mb-6'} rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-sm font-semibold text-zinc-100">LIVE SIGNAL FEED</div>
            <div className="text-[10px] text-zinc-500 font-mono">Delta stream · max 3 per sync</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? 'bg-zinc-500' : 'bg-emerald-500 animate-pulse'}`} />
            {isPaused ? 'PAUSED' : 'STREAMING'}
          </div>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="px-3 py-1 rounded text-[10px] font-mono border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      <div
        ref={feedRef}
        className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-2 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(82, 82, 91, 0.3) transparent' }}
      >
        {signals.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">Monitoring for changes…</div>
        ) : (
          signals.map((s) => {
            const c = cfg(s.type);
            const Icon = c.icon;

            return (
              <div key={s.id} className={`rounded-lg border p-3 ${c.bg} ${c.border} animate-[slideIn_0.28s_ease-out]`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-1.5 rounded bg-zinc-950/50">
                      <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono tracking-wider ${c.color}`}>{c.label}</span>
                        {typeof s.delta === 'number' && (
                          <span className={`text-[10px] font-mono ${c.color}`}>{s.delta > 0 ? '+' : ''}{s.delta}</span>
                        )}
                        <span className="text-[10px] text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{s.event.region}</span>
                      </div>

                      <div className="text-sm text-zinc-200 leading-tight">{displayTitleFor(s.event)}</div>

                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span>SEV {s.event.severity}</span>
                        <span className="text-zinc-700">•</span>
                        <span>{s.event.confidence}</span>
                        <span className="text-zinc-700">•</span>
                        <span className={c.color}>{relTime(s.ts)} ago</span>
                      </div>
                    </div>
                  </div>

                  <div className={`h-2 w-2 rounded-full ${c.pulse} animate-pulse`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-900/20">
        <div className="text-[10px] text-zinc-500 font-mono">{signals.length} signals</div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{signals.filter((x) => x.type === 'escalation').length}</div>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{signals.filter((x) => x.type === 'new').length}</div>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{signals.filter((x) => x.type === 'deescalation').length}</div>
        </div>
      </div>
    </div>
  );
}

// --- Hero Map (stylized world silhouette + glowing pins) ---

type MapPoint = { x: number; y: number };

type LatLon = { lat: number; lon: number };

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

// Simple equirectangular projection into the SVG viewBox.
// Accepts mapW/mapH for flexible coordinate space.
function projectLonLatToMap({ lon, lat }: LatLon, mapW: number, mapH: number): MapPoint {
  const x01 = clamp01((lon + 180) / 360);
  const y01 = clamp01((90 - lat) / 180);

  return {
    x: x01 * mapW,
    y: y01 * mapH,
  };
}

// While using demo data, keep pins stable (no random jitter).
// When you switch to real geo-coded events (lat/lon per event), flip this back on.
const PIN_JITTER_ENABLED = false;

const REGION_AREAS: Record<string, { center: LatLon; spread: { lat: number; lon: number } }> = {
  // --- SECURITY HOTSPOTS ---
  "middle east": { center: { lat: 31.5, lon: 35.0 }, spread: { lat: 6.5, lon: 10 } }, // Levant + Iraq
  "eastern europe": { center: { lat: 49.0, lon: 31.0 }, spread: { lat: 6, lon: 10 } }, // Ukraine / region
  "south china sea": { center: { lat: 14.0, lon: 115.0 }, spread: { lat: 7, lon: 10 } },
  "korean peninsula": { center: { lat: 36.2, lon: 127.9 }, spread: { lat: 2.2, lon: 2.8 } },

  // --- STATE ---
  "south america": { center: { lat: -15.0, lon: -58.0 }, spread: { lat: 10, lon: 14 } }, // Brazil/Andes spread
  "latin america": { center: { lat: -12.0, lon: -60.0 }, spread: { lat: 12, lon: 18 } },
  "africa": { center: { lat: 9.0, lon: 20.0 }, spread: { lat: 14, lon: 18 } }, // Sahel-ish
  "europe": { center: { lat: 48.5, lon: 9.0 }, spread: { lat: 8, lon: 12 } },
  "north america": { center: { lat: 39.0, lon: -98.0 }, spread: { lat: 10, lon: 18 } }, // US-centered

  // --- MARKETS ---
  "asia pacific": { center: { lat: 22.0, lon: 120.0 }, spread: { lat: 8, lon: 10 } }, // Taiwan/PH/JP edge
  "east asia": { center: { lat: 35.0, lon: 103.0 }, spread: { lat: 10, lon: 14 } },
  "global": { center: { lat: 10.0, lon: 0.0 }, spread: { lat: 18, lon: 28 } },
};

function regionToLatLon(region: string, seedKey: string): LatLon {
  const key = region.toLowerCase().trim();
  const area = REGION_AREAS[key];

  // If we don't recognize the region label, fall back to a small set of sane global centers
  const fallbackCenters: LatLon[] = [
    { lat: 31.5, lon: 35.0 },   // Middle East
    { lat: 49.0, lon: 31.0 },   // Eastern Europe
    { lat: 22.0, lon: 120.0 },  // APAC
    { lat: -15.0, lon: -58.0 }, // South America
    { lat: 9.0, lon: 20.0 },    // Africa
    { lat: 39.0, lon: -98.0 },  // North America
  ];

  const base = area?.center ?? fallbackCenters[hashSeed(key) % fallbackCenters.length];

  // During demo mode, keep pins stable so the map reads “accurate”.
  if (!PIN_JITTER_ENABLED) {
    return {
      lat: clamp(base.lat, -80, 80),
      lon: clamp(base.lon, -179.9, 179.9),
    };
  }

  const spread = area?.spread ?? { lat: 6, lon: 10 };

  // Stable pseudo-random offset inside the region box (prevents stacks on one centroid)
  const h = hashSeed(`${seedKey}|${key}`);
  const r1 = rand01(h + 11);
  const r2 = rand01(h + 29);

  // Centered [-1..1] then scaled
  const dLat = (r1 * 2 - 1) * spread.lat;
  const dLon = (r2 * 2 - 1) * spread.lon;

  return {
    lat: clamp(base.lat + dLat, -80, 80),
    lon: clamp(base.lon + dLon, -179.9, 179.9),
  };
}

function regionToPoint(event: EventItem, mapW: number, mapH: number): MapPoint {
  return projectLonLatToMap(regionToLatLon(event.region, event.id), mapW, mapH);
}

function sevColor(sev: number) {
  if (sev >= 80) return { ring: "rgba(239,68,68,0.9)", fill: "rgba(239,68,68,0.35)" };
  if (sev >= 60) return { ring: "rgba(249,115,22,0.9)", fill: "rgba(249,115,22,0.30)" };
  if (sev >= 40) return { ring: "rgba(234,179,8,0.9)", fill: "rgba(234,179,8,0.28)" };
  return { ring: "rgba(16,185,129,0.9)", fill: "rgba(16,185,129,0.26)" };
}

function regionCode(region: string) {
  const r = region.trim().toUpperCase();
  const map: Record<string, string> = {
    'MIDDLE EAST': 'MIDEAST',
    'EASTERN EUROPE': 'E EUR',
    'SOUTH AMERICA': 'S AM',
    'ASIA PACIFIC': 'APAC',
    'NORTH AMERICA': 'N AM',
    'SOUTH CHINA SEA': 'SCS',
    'KOREAN PENINSULA': 'KOREA',
    'LATIN AMERICA': 'LATAM',
    'AFRICA': 'AFR',
    'EUROPE': 'EUR',
    'GLOBAL': 'GLBL',
    'EAST ASIA': 'E ASIA',
  };
  return map[r] ?? (r.length <= 10 ? r : r.slice(0, 10));
}
function hashSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand01(seed: number) {
  // xorshift32
  let x = seed || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 10000) / 10000;
}

type MapPulse = { key: string; eventId: string; region: string; severity: number };

// Replace your HeroMap function with this enhanced tactical version
function HeroMap({
  events,
  worldThreat,
  onSelectEvent,
  rightOverlay,
  pulse,
}: {
  events: EventItem[];
  worldThreat: number;
  onSelectEvent: (event: EventItem) => void;
  rightOverlay?: ReactNode;
  pulse?: MapPulse | null;
}) {
  const [worldSvg, setWorldSvg] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState<{ w: number; h: number } | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ id: string; p: MapPoint } | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(
    new Set(['SECURITY', 'STATE', 'MARKETS'])
  );
  const [legendOpen, setLegendOpen] = useState(false);

  // --- Zoom / Pan (SVG viewBox; stays sharp) ---
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  const [viewBox, setViewBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: mapSize?.w ?? 1000,
    h: mapSize?.h ?? 520,
  });

  // Keep viewBox synced to the loaded SVG dimensions on first load (and if map changes)
  useEffect(() => {
    if (!mapSize) return;
    const raf = window.requestAnimationFrame(() => {
      setViewBox({ x: 0, y: 0, w: mapSize.w, h: mapSize.h });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [mapSize]);

  const zoomPct = useMemo(() => {
    if (!mapSize) return 100;
    return Math.round((mapSize.w / viewBox.w) * 100);
  }, [mapSize, viewBox.w]);

  const resetView = useCallback(() => {
    if (!mapSize) return;
    setViewBox({ x: 0, y: 0, w: mapSize.w, h: mapSize.h });
  }, [mapSize]);

  // Wheel zoom (non-passive so we can prevent page scroll)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      if (!mapSize) return;

      const rect = el.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;

      // Convert mouse position to SVG units within current viewBox
      const mx = viewBox.x + (px / rect.width) * viewBox.w;
      const my = viewBox.y + (py / rect.height) * viewBox.h;

      const dir = ev.deltaY > 0 ? -1 : 1; // up = zoom in
      const factor = dir > 0 ? 0.92 : 1.08; // shrink viewBox to zoom in

      const nextW = clamp(viewBox.w * factor, mapSize.w / 4, mapSize.w); // max zoom = 4x
      const nextH = clamp(viewBox.h * factor, mapSize.h / 4, mapSize.h);

      // Keep mouse point stable by anchoring around (mx,my)
      const nx = mx - ((mx - viewBox.x) / viewBox.w) * nextW;
      const ny = my - ((my - viewBox.y) / viewBox.h) * nextH;

      // Clamp to map bounds
      const clampedX = clamp(nx, 0, mapSize.w - nextW);
      const clampedY = clamp(ny, 0, mapSize.h - nextH);

      setViewBox({ x: clampedX, y: clampedY, w: nextW, h: nextH });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [viewBox.x, viewBox.y, viewBox.w, viewBox.h, mapSize]);

  const onMouseDownViewport = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanningRef.current = true;
    lastPtRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMoveViewport = (e: React.MouseEvent) => {
    if (!isPanningRef.current || !lastPtRef.current) return;
    if (!mapSize) return;

    const el = viewportRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dxPx = e.clientX - lastPtRef.current.x;
    const dyPx = e.clientY - lastPtRef.current.y;
    lastPtRef.current = { x: e.clientX, y: e.clientY };

    const dx = (dxPx / rect.width) * viewBox.w;
    const dy = (dyPx / rect.height) * viewBox.h;

    setViewBox((vb) => {
      const nx = clamp(vb.x - dx, 0, mapSize.w - vb.w);
      const ny = clamp(vb.y - dy, 0, mapSize.h - vb.h);
      return { ...vb, x: nx, y: ny };
    });
  };

  const endPan = () => {
    isPanningRef.current = false;
    lastPtRef.current = null;
  };
  // TEMP: turn on to verify map projection alignment (remove once confirmed)
  const GEO_DEBUG = false;
  // Scale UI sizes to the SVG coordinate space (original UI tuned for ~1000px wide maps)
  const uiScale = mapSize ? mapSize.w / 1000 : 1;
  // Visual noise controls (we'll re-introduce layers intentionally)
  const SHOW_CONNECTIONS = false;
  const SHOW_SEISMIC = true;
  const SHOW_HEAT_ZONES = false;

  useEffect(() => {
    let cancelled = false;
    fetch("/world.svg")
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => {
        if (cancelled) return;
        if (t && t.includes("<svg")) {
          // Parse viewBox so pins project into the exact same coordinate space
          const m = t.match(/viewBox=\"0 0 ([\d.]+) ([\d.]+)\"/);
          if (m) {
            const w = Number(m[1]);
            const h = Number(m[2]);
            if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
              setMapSize({ w, h });
            }
          }
          // Keep only inner SVG content so we can render it inside our own <svg viewBox=...>
          const inner = t
            .replace(/^[\s\S]*?<svg[^>]*>/i, '')
            .replace(/<\/svg>\s*$/i, '');
          setWorldSvg(inner);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Filter by active categories and show top 12 events, excluding global/worldwide pins
  const pins = useMemo(() => {
    if (!mapSize) return [];

    const filtered = events
      .filter((e) => activeCategories.has(e.category))
      // Global / worldwide items should not appear as a single “GLBL” pin.
      // They’re better represented by the overall threat and the feed.
      .filter((e) => {
        const r = e.region.toLowerCase().trim();
        return r !== 'global' && r !== 'worldwide' && r !== 'world';
      })
      .slice()
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 12);

    return filtered.map((e, idx) => {
      const base = regionToPoint(e, mapSize.w, mapSize.h);
      // Offset intentionally disabled while we dial in exact geo positioning.
      // (We can reintroduce collision-avoidance nudges later, but not category offsets.)
      const offset = { x: 0, y: 0 };

      return {
        e,
        p: { x: base.x + offset.x, y: base.y + offset.y },
        c: sevColor(e.severity),
        primary: idx === 0,
      };
    });
  }, [events, activeCategories, mapSize]);

  // Seismic “activity field” (map-native dots around event origin)
  const seismicDots = useMemo(() => {
    if (!mapSize) return [];

    const src = events
      .filter((e) => activeCategories.has(e.category))
      .filter((e) => {
        const r = e.region.toLowerCase().trim();
        return r !== 'global' && r !== 'worldwide' && r !== 'world';
      })
      .slice(0, 18); // keep it tasteful

    const dots: Array<{
      key: string;
      x: number;
      y: number;
      r: number;
      ring: string;
      delay: string;
      dur: string;
      baseOpacity: number;
    }> = [];

    for (let i = 0; i < src.length; i++) {
      const e = src[i];
      const baseP = regionToPoint(e, mapSize.w, mapSize.h);
      const c = sevColor(e.severity);

      // Density scales with severity + confidence (verified feels “heavier”)
      const confBoost = e.confidence === 'HIGH' ? 2 : e.confidence === 'MED' ? 1 : 0;
      const count = clamp(Math.floor(e.severity / 18) + confBoost, 3, 8);

      // Spread scales slightly with severity so critical looks “louder”
      const spread = e.severity >= 80 ? 30 : e.severity >= 60 ? 24 : e.severity >= 40 ? 20 : 16;

      const base = hashSeed(e.id + '|' + e.region + '|' + e.category);

      for (let k = 0; k < count; k++) {
        const s1 = base + (k + 1) * 101;
        const s2 = base + (k + 1) * 203;

        const ox = (rand01(s1) * 2 - 1) * spread;
        const oy = (rand01(s2) * 2 - 1) * (spread * 0.78);

        const rr = (1.4 + (k % 3) * 0.7) * uiScale;
        const delay = ((k * 0.18) + (i % 5) * 0.07).toFixed(2);
        const dur = (2.2 + (k % 4) * 0.35 + (e.severity >= 80 ? 0.15 : 0)).toFixed(2);

        dots.push({
          key: `sd-${e.id}-${k}`,
          x: baseP.x + ox,
          y: baseP.y + oy,
          r: rr,
          ring: c.ring,
          delay: `${delay}s`,
          dur: `${dur}s`,
          baseOpacity: e.severity >= 80 ? 0.62 : e.severity >= 60 ? 0.55 : e.severity >= 40 ? 0.48 : 0.42,
        });
      }
    }

    return dots;
  }, [events, activeCategories, mapSize, uiScale]);

  const pulseRender = useMemo(() => {
    if (!pulse) return null;

    const match = pins.find((x) => x.e.id === pulse.eventId);
    const p = match?.p ?? (mapSize ? projectLonLatToMap(regionToLatLon(pulse.region, pulse.key), mapSize.w, mapSize.h) : { x: 500, y: 260 });
    const c = sevColor(pulse.severity);

    return { key: pulse.key, p, c };
  }, [pulse, pins, mapSize]);

  // Calculate connection lines between related events
  const connections = useMemo(() => {
    const lines: Array<{ from: MapPoint; to: MapPoint; color: string; opacity: number }> = [];
    
    for (let i = 0; i < Math.min(pins.length, 8); i++) {
      for (let j = i + 1; j < Math.min(pins.length, 8); j++) {
        const pin1 = pins[i];
        const pin2 = pins[j];
        
        // Connect if same category or both high severity
        const sameCategory = pin1.e.category === pin2.e.category;
        const bothHighSev = pin1.e.severity >= 70 && pin2.e.severity >= 70;
        const distance = Math.sqrt(
          Math.pow(pin2.p.x - pin1.p.x, 2) + 
          Math.pow(pin2.p.y - pin1.p.y, 2)
        );
        
        if ((sameCategory && distance < 250) || bothHighSev) {
          const avgSeverity = (pin1.e.severity + pin2.e.severity) / 2;
          lines.push({
            from: pin1.p,
            to: pin2.p,
            color: sevColor(avgSeverity).ring,
            opacity: 0.2 + (avgSeverity / 100) * 0.3,
          });
        }
      }
    }
    
    return lines;
  }, [pins]);

  const updatedStamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const toggleCategory = (cat: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat); // Keep at least one active
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  return (
    <section className="relative">
      <div className="sticky top-0 z-0 h-[80vh] min-h-[640px]">
        <div className="absolute inset-0 bg-black">
          {/* Keep your existing vignette and grid */}
        <div className="absolute inset-0 bg-[radial-gradient(1400px_800px_at_50%_12%,rgba(16,185,129,0.15),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_60%_40%,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_35%_55%,rgba(249,115,22,0.10),transparent_60%)]" />

          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          {/* Map */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Zoom/pan viewport */}
            <div
              ref={viewportRef}
              className="relative h-full w-full overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing"
              onMouseDown={onMouseDownViewport}
              onMouseMove={onMouseMoveViewport}
              onMouseUp={endPan}
              onMouseLeave={endPan}
              onDoubleClick={resetView}
              aria-label="Interactive world map"
            >
              {/* Transform layer (applies to both the SVG map and the pin overlay) */}
              <div className="absolute inset-0">
                {/* Keep SVG coordinate space and on-screen aspect ratio aligned */}
                <div className="relative h-full w-full">
                  {/* Enhanced tactical SVG overlay */}
                  <svg
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* World map (rendered inside the same SVG so it zooms/pans with pins) */}
                    {worldSvg ? (
                      <g
                        opacity={0.35}
                        pointerEvents="none"
                        style={{ filter: 'drop-shadow(0 0 22px rgba(16,185,129,0.12))' }}
                      >
                        <g
                          style={{
                            // Keep the prior vignette-like masking feel
                            maskImage: 'radial-gradient(2200px 1300px at 50% 45%, black 72%, transparent 94%)',
                            WebkitMaskImage: 'radial-gradient(2200px 1300px at 50% 45%, black 72%, transparent 94%)',
                          }}
                        >
                          <g
                            // Style all paths uniformly (fast, no per-path edits)
                            style={{
                              fill: 'rgba(16,185,129,0.16)',
                              stroke: 'rgba(16,185,129,0.28)',
                              strokeWidth: 0.9,
                            }}
                            dangerouslySetInnerHTML={{ __html: worldSvg }}
                          />
                        </g>
                      </g>
                    ) : (
                      <g pointerEvents="none">
                        <text
                          x={(mapSize?.w ?? 1000) / 2}
                          y={(mapSize?.h ?? 520) / 2}
                          textAnchor="middle"
                          fill="rgba(113,113,122,0.8)"
                          fontSize={14}
                          fontFamily="monospace"
                        >
                          world.svg not loaded
                        </text>
                      </g>
                    )}
              <defs>
                <filter id="tactical-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.2 0"
                    result="glow"
                  />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="ring-distort" x="-40%" y="-40%" width="180%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="2" result="noise">
                    <animate attributeName="baseFrequency" values="0.012;0.02;0.012" dur="0.35s" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
                </filter>

                {hoveredPin ? (
                  <mask id="hover-spotlight">
                    <rect x="0" y="0" width={mapSize?.w ?? 1000} height={mapSize?.h ?? 520} fill="white" />
                    <circle cx={hoveredPin.p.x} cy={hoveredPin.p.y} r={95} fill="black" />
                  </mask>
                ) : null}
              </defs>

              {/* Subtle background dim on hover (spotlight around hovered pin) */}
              {hoveredPin ? (
                <rect
                  x="0"
                  y="0"
                  width={mapSize?.w ?? 1000}
                  height={mapSize?.h ?? 520}
                  fill="rgba(0,0,0,0.42)"
                  mask="url(#hover-spotlight)"
                  pointerEvents="none"
                />
              ) : null}

              {/* Geo debug markers (toggle with GEO_DEBUG) */}
              {GEO_DEBUG && mapSize ? (
                <g pointerEvents="none" opacity="0.85">
                  {(
                    [
                      { label: '0,0', lon: 0, lat: 0 },
                      { label: '0,30N', lon: 0, lat: 30 },
                      { label: '0,30S', lon: 0, lat: -30 },
                      { label: '90E,0', lon: 90, lat: 0 },
                      { label: '90W,0', lon: -90, lat: 0 },
                      { label: '180,0', lon: 180, lat: 0 },
                    ] as const
                  ).map((pt) => {
                    const p = projectLonLatToMap({ lon: pt.lon, lat: pt.lat }, mapSize.w, mapSize.h);
                    return (
                      <g key={pt.label}>
                        <line x1={p.x - 10} y1={p.y} x2={p.x + 10} y2={p.y} stroke="rgba(16,185,129,0.9)" strokeWidth={1} />
                        <line x1={p.x} y1={p.y - 10} x2={p.x} y2={p.y + 10} stroke="rgba(16,185,129,0.9)" strokeWidth={1} />
                        <circle cx={p.x} cy={p.y} r={3} fill="rgba(0,0,0,0.85)" stroke="rgba(16,185,129,0.9)" strokeWidth={1} />
                        <text x={p.x + 12} y={p.y - 8} fill="rgba(161,161,170,0.95)" fontSize="10" fontFamily="monospace">
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ) : null}
              {/* Feed-triggered pulse (single, tasteful) */}
              {pulseRender ? (
                <g key={pulseRender.key} pointerEvents="none">
                  <circle
                    cx={pulseRender.p.x}
                    cy={pulseRender.p.y}
                    r={10 * uiScale}
                    fill="none"
                    stroke={pulseRender.c.ring}
                    strokeWidth={2}
                    opacity={0.9}
                  >
                    <animate attributeName="r" values={`${10 * uiScale};${70 * uiScale}`} dur="1.4s" repeatCount="1" />
                    <animate attributeName="opacity" values="0.95;0" dur="1.4s" repeatCount="1" />
                  </circle>
                  <circle
                    cx={pulseRender.p.x}
                    cy={pulseRender.p.y}
                    r={4 * uiScale}
                    fill={pulseRender.c.ring}
                    opacity={0.9}
                  >
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="0.6s" repeatCount="2" />
                  </circle>
                </g>
              ) : null}
              {/* Connection lines */}
              {SHOW_CONNECTIONS ? (
                <g opacity="0.5">
                  {connections.map((conn, idx) => {
                    const midX = (conn.from.x + conn.to.x) / 2;
                    const midY = (conn.from.y + conn.to.y) / 2;
                    const controlY = midY - 30;

                    return (
                      <path
                        key={idx}
                        d={`M ${conn.from.x} ${conn.from.y} Q ${midX} ${controlY} ${conn.to.x} ${conn.to.y}`}
                        stroke={conn.color}
                        strokeWidth={1}
                        fill="none"
                        strokeDasharray="3,3"
                        opacity={conn.opacity}
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="0;-6"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </path>
                    );
                  })}
                </g>
              ) : null}
              {SHOW_SEISMIC ? (
                <>
                  {/* Seismic activity dots (severity-coded, map-native) */}
                  <g opacity="0.95" pointerEvents="none">
                    {seismicDots.map((d) => (
                      <circle
                        key={d.key}
                        cx={d.x}
                        cy={d.y}
                        r={d.r}
                        fill={d.ring}
                        opacity={d.baseOpacity}
                      >
                        <animate
                          attributeName="opacity"
                          values={`${Math.max(0.12, d.baseOpacity - 0.25)};${d.baseOpacity};${Math.max(0.12, d.baseOpacity - 0.25)}`}
                          dur={d.dur}
                          begin={d.delay}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="r"
                          values={`${d.r};${d.r + 1.8 * uiScale};${d.r}`}
                          dur={d.dur}
                          begin={d.delay}
                          repeatCount="indefinite"
                        />
                      </circle>
                    ))}
                  </g>

                  {/* Seismic label (small, tactical) */}
                  <g>
                    <rect x="22" y={(mapSize?.h ?? 520) - 30} width="210" height="22" rx="6" fill="rgba(0,0,0,0.55)" stroke="rgba(63,63,70,0.55)" strokeWidth="1" />
                    <text x="34" y={(mapSize?.h ?? 520) - 15} fill="rgba(161,161,170,0.9)" fontSize="9" fontFamily="monospace" letterSpacing="3">SEISMIC ACTIVITY</text>
                    <text x="188" y={(mapSize?.h ?? 520) - 15} fill="rgba(82,82,91,0.9)" fontSize="9" fontFamily="monospace">DOTS</text>
                  </g>
                </>
              ) : null}

              {SHOW_HEAT_ZONES ? (
                <>
                  {/* Threat zones around high-severity events */}
                  {pins.filter(p => p.e.severity >= 70).map(({ e, p, c }) => (
                    <circle
                      key={`zone-${e.id}`}
                      cx={p.x}
                      cy={p.y}
                      r={e.severity >= 80 ? 38 : 28}
                      fill={c.fill}
                      opacity={0.10}
                    />
                  ))}
                  {/* NEW: Regional heat zones - clusters of nearby threats */}
                  {(() => {
                    const clusters: Array<{ center: MapPoint; severity: number; count: number }> = [];
                    const CLUSTER_RADIUS = 120;

                    pins.forEach((pin) => {
                      let found = false;
                      clusters.forEach((cluster) => {
                        const dist = Math.sqrt(
                          Math.pow(cluster.center.x - pin.p.x, 2) +
                          Math.pow(cluster.center.y - pin.p.y, 2)
                        );
                        if (dist < CLUSTER_RADIUS) {
                          cluster.severity = Math.max(cluster.severity, pin.e.severity);
                          cluster.count++;
                          found = true;
                        }
                      });

                      if (!found && pin.e.severity >= 60) {
                        clusters.push({
                          center: pin.p,
                          severity: pin.e.severity,
                          count: 1,
                        });
                      }
                    });

                    return clusters
                      .filter((c) => c.count >= 2 || c.severity >= 75)
                      .map((cluster, idx) => {
                        const c = sevColor(cluster.severity);
                        const radius = 65 + cluster.count * 12;

                        return (
                          <g key={`cluster-${idx}`}>
                            <circle
                              cx={cluster.center.x}
                              cy={cluster.center.y}
                              r={radius}
                              fill={c.fill}
                              opacity={0.08}
                            >
                              <animate
                                attributeName="r"
                                values={`${radius};${radius + 15};${radius}`}
                                dur="5s"
                                repeatCount="indefinite"
                              />
                            </circle>

                            <circle
                              cx={cluster.center.x}
                              cy={cluster.center.y}
                              r={radius * 0.6}
                              fill={c.fill}
                              opacity={0.15}
                            >
                              <animate
                                attributeName="opacity"
                                values="0.10;0.20;0.10"
                                dur="4s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </g>
                        );
                      });
                  })()}
                </>
              ) : null}

              {/* Enhanced pins with tactical labels */}
<g filter="url(#tactical-glow)">
  {pins.map(({ e, p, c, primary }, idx) => {
    const isHovered = hoveredPin?.id === e.id;
    // Show label only for top threat or when hovered
    const showLabel = idx === 0 || isHovered;
    const pinSize = (idx === 0 ? 10 : idx === 1 ? 8 : idx === 2 ? 7 : 5) * uiScale;
    const baseLabelW = 110 * uiScale;
    const baseLabelH = 22 * uiScale;
    const hoverLabelW = 190 * uiScale;
    const hoverLabelH = 34 * uiScale;
    const labelW = isHovered ? hoverLabelW : baseLabelW;
    const labelH = isHovered ? hoverLabelH : baseLabelH;
    const code = regionCode(e.region);

    return (
      <g
        key={e.id}
        onMouseEnter={() => setHoveredPin({ id: e.id, p })}
        onMouseLeave={() => setHoveredPin(null)}
        onClick={() => onSelectEvent(e)}
        style={{ cursor: 'pointer' }}
      >
        {/* Outer glow field - larger for top threats */}
        <circle
          cx={p.x}
          cy={p.y}
          r={(idx === 0 ? 24 : idx === 1 ? 18 : idx === 2 ? 14 : 12) * uiScale}
          fill={c.fill}
          opacity={idx === 0 ? 0.20 : idx === 1 ? 0.14 : 0.10}
        />

        {/* Core pin - larger for top 3 */}
        <circle
          cx={p.x}
          cy={p.y}
          r={pinSize}
          fill="rgba(0,0,0,0.92)"
          stroke={c.ring}
          strokeWidth={2}
        >
          {isHovered ? (
            <>
              <animate attributeName="r" values={`${pinSize};${pinSize + 2};${pinSize}`} dur="0.18s" repeatCount="1" />
              <animate attributeName="stroke-width" values="2;3;2" dur="0.18s" repeatCount="1" />
            </>
          ) : null}
        </circle>

        {/* Inner indicator */}
        <circle
          cx={p.x}
          cy={p.y}
          r={pinSize * 0.45}
          fill={c.ring}
          opacity={0.95}
        />

        {/* ALWAYS-ON tactical label for top 3 */}
        {showLabel && (
          <>
            {/* Label background */}
            <rect
              x={p.x + pinSize + 8 * uiScale}
              y={p.y - 11 * uiScale}
              width={labelW}
              height={labelH}
              fill="rgba(0,0,0,0.94)"
              stroke={c.ring}
              strokeWidth={0.8}
              rx={3}
            >
              {isHovered ? (
                <>
                  {/* deploy with slight latency */}
                  <animate attributeName="x" values={`${p.x + pinSize + 2};${p.x + pinSize + 8}`} dur="160ms" begin="0.05s" fill="freeze" />
                  <animate attributeName="width" values={`${baseLabelW};${hoverLabelW}`} dur="160ms" begin="0.05s" fill="freeze" />
                  <animate attributeName="height" values={`${baseLabelH};${hoverLabelH}`} dur="160ms" begin="0.05s" fill="freeze" />
                </>
              ) : null}
            </rect>

            {/* Connector line */}
            <line
              x1={p.x + pinSize}
              y1={p.y}
              x2={p.x + pinSize + 8 * uiScale}
              y2={p.y}
              stroke={c.ring}
              strokeWidth={0.8}
              opacity={0.75}
            />

            {/* ClipPath for label text */}
            <defs>
              <clipPath id={`label-clip-${idx}`}> 
                <rect
                  x={p.x + pinSize + 12 * uiScale}
                  y={p.y - 10 * uiScale}
                  width={hoverLabelW - 16 * uiScale}
                  height={hoverLabelH - 4 * uiScale}
                  rx={2 * uiScale}
                />
              </clipPath>
            </defs>

            <g
              style={{
                transform: `translateX(${isHovered ? 14 : 0}px)`,
                transformOrigin: 'left center',
                transition: 'transform 160ms ease, opacity 160ms ease',
                opacity: isHovered ? 1 : 0.88,
              }}
            >
              <g
                clipPath={`url(#label-clip-${idx})`}
                className={isHovered ? 'animate-[labelPop_160ms_ease-out,glitchNudge_260ms_steps(2,end)]' : ''}
              >
              {/* Severity */}
              <text
                x={p.x + pinSize + 14 * uiScale}
                y={p.y + 1 * uiScale}
                dominantBaseline="middle"
                fill={c.ring}
                fontSize={isHovered ? 11 * uiScale : 12 * uiScale}
                fontFamily="monospace"
                fontWeight="bold"
                style={
                  isHovered
                    ? { opacity: 0, animation: 'labelLineIn 140ms ease-out forwards', animationDelay: '80ms' }
                    : undefined
                }
              >
                {e.severity}
              </text>

              {/* Region */}
              <text
                x={p.x + pinSize + 38 * uiScale}
                y={p.y + 1 * uiScale}
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.68)"
                fontSize={9 * uiScale}
                fontFamily="monospace"
                style={
                  isHovered
                    ? { opacity: 0, animation: 'labelLineIn 140ms ease-out forwards', animationDelay: '110ms' }
                    : undefined
                }
              >
                {code}
              </text>

              {/* Title snippet (hover only) */}
              {isHovered && (
                <text
                  x={p.x + pinSize + 14 * uiScale}
                  y={p.y + 13 * uiScale}
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.78)"
                  fontSize={9 * uiScale}
                  fontFamily="monospace"
                  style={{ opacity: 0, animation: 'labelLineIn 150ms ease-out forwards', animationDelay: '140ms' }}
                >
                  {displayTitleFor(e).slice(0, 22).toUpperCase()}
                </text>
              )}
              </g>
            </g>
          </>
        )}

        {/* DEVELOPING badge for events <5min old */}
        {e.updatedMinutesAgo < 5 && idx < 3 && (
          <g>
            <rect
              x={p.x - 26}
              y={p.y - pinSize - 16}
              width={52}
              height={12}
              fill="rgba(239,68,68,0.15)"
              stroke="rgba(239,68,68,0.8)"
              strokeWidth={0.6}
              rx={2}
            />
            <text
              x={p.x}
              y={p.y - pinSize - 8}
              fill="rgba(239,68,68,1)"
              fontSize="7"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              DEVELOPING
            </text>
          </g>
        )}

      </g>
    );
  })}
</g>
                  </svg>
                </div>
              </div>

              {/* Zoom hint + reset */}
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-zinc-800/60 bg-black/40 px-3 py-2 backdrop-blur-md">
                <div className="text-[10px] font-mono text-zinc-500">Scroll: zoom · Drag: pan · Double-click: reset</div>
              </div>

              <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg border border-zinc-800/60 bg-black/40 px-3 py-2 backdrop-blur-md">
                <div className="text-[10px] font-mono text-zinc-500">ZOOM</div>
                <div className="mt-1 text-xs font-mono text-zinc-300">{zoomPct}%</div>
              </div>
            </div>
          </div>

          {/* Keep your existing center threat module - UNCHANGED */}
          <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2">
            {/* ... your existing threat module code ... */}
          </div>

          {/* Top-left label - UNCHANGED */}
          <div className="pointer-events-none absolute left-6 top-6">
            <div className="text-[11px] tracking-[0.28em] text-zinc-500">GLOBAL ACTIVITY MONITOR</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">LIVE</span>
              <span className="text-zinc-700">•</span>
              <span className="font-mono" suppressHydrationWarning>
                Updated {updatedStamp}
              </span>
            </div>
          </div>

          {/* Tactical legend (collapsible to avoid map + feed clutter) */}
          <div className="absolute right-6 top-6 z-50 pointer-events-auto">
            {/* Compact toggle (always visible) */}
            <button
              type="button"
              onClick={() => setLegendOpen((v) => !v)}
              className={
                "flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-black/55 backdrop-blur-md px-3 py-2 transition-all hover:border-zinc-700 " +
                (legendOpen ? "shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" : "")
              }
              aria-label={legendOpen ? 'Hide legend' : 'Show legend'}
            >
              <span className="text-[9px] tracking-[0.26em] text-zinc-500">LEGEND</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{legendOpen ? '−' : '+'}</span>
            </button>

            {/* Full panel (only when open) */}
            {legendOpen ? (
              <div className="mt-2 w-[200px] rounded-lg border border-zinc-800/60 bg-black/50 backdrop-blur-md px-3 py-2.5 space-y-3">
                {/* Severity legend */}
                <div>
                  <div className="text-[9px] tracking-[0.26em] text-zinc-500 mb-2">THREAT LEVELS</div>
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[10px]">CRITICAL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-[10px]">ELEVATED</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="text-[10px]">WATCH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px]">MONITOR</span>
                    </div>
                  </div>
                </div>

                {/* Category filters */}
                <div className="pt-3 border-t border-zinc-800/60">
                  <div className="text-[9px] tracking-[0.26em] text-zinc-500 mb-2">CATEGORIES</div>
                  <div className="space-y-1.5">
                    {(['SECURITY', 'STATE', 'MARKETS'] as Category[]).map(cat => {
                      const Icon = cat === 'SECURITY' ? Shield : cat === 'STATE' ? Globe : DollarSign;
                      const isActive = activeCategories.has(cat);
                      const color = cat === 'SECURITY' ? 'text-red-400' : cat === 'STATE' ? 'text-purple-400' : 'text-blue-400';
                      const bgColor = cat === 'SECURITY' ? 'bg-red-500/10' : cat === 'STATE' ? 'bg-purple-500/10' : 'bg-blue-500/10';

                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-2 w-full rounded px-2 py-1 text-[10px] transition-all ${
                            isActive
                              ? `${bgColor} ${color} border border-zinc-700`
                              : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="font-mono">{cat.slice(0, 3)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pin count */}
                <div className="pt-2 border-t border-zinc-800/60 text-[9px] text-zinc-600 font-mono">
                  {pins.length} ACTIVE
                </div>
              </div>
            ) : null}
          </div>

          {/* Right-side overlay (Live Signal Feed) */}
          {rightOverlay ? (
            <div className="absolute right-6 top-[168px] z-40 w-[380px] max-w-[92vw] pointer-events-auto">
              {rightOverlay}
            </div>
          ) : null}



{/* Keep your existing bottom fade */}
<div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-black" />
        </div>
      </div>

      {/* Keep your existing spacer */}
      <div className="h-[52vh]" />
    </section>
  );
}

export default function SituationMonitor() {
  const [mapPulse, setMapPulse] = useState<MapPulse | null>(null);
  const onFeedSignal = useCallback((s: LiveSignal) => {
    setMapPulse({
      key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      eventId: s.event.id,
      region: s.event.region,
      severity: s.event.severity,
    });
  }, []);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [severityThreshold, setSeverityThreshold] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'severity' | 'recent'>('severity');
  const [confidenceFilter, setConfidenceFilter] = useState<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const consoleRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // LIVE sync timer (UI only; data can plug in later)
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [lastSyncMs, setLastSyncMs] = useState(() => Date.now());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Live event store (demo sync). Replace with real API response later.
  const [eventsData, setEventsData] = useState<EventItem[]>(() => EVENTS);
  const prevEventsRef = useRef<EventItem[]>(EVENTS);
  const [syncTick, setSyncTick] = useState(0);

  const [threatAnim, setThreatAnim] = useState<'idle' | 'swap'>('idle');
  const prevTopThreatIdRef = useRef<string | null>(null);


  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // simulate background sync heartbeat (keeps UI feeling alive)
    const t = setInterval(() => {
      setSyncTick((k) => k + 1);
      setLastSyncMs(Date.now());
    }, 15000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // `/` focuses search like X / Discord command habits
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isTyping = tag === 'input' || tag === 'textarea' || !!target?.isContentEditable;
        if (!isTyping) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      if (e.key === 'Escape') {
        // quick exit: clear search if focused
        if (document.activeElement === searchInputRef.current && searchQuery) {
          setSearchQuery('');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchQuery]);

  const secondsSinceSync = Math.max(0, Math.floor((nowMs - lastSyncMs) / 1000));
  const syncLabel = secondsSinceSync < 60 ? `${secondsSinceSync}s since sync` : `${Math.floor(secondsSinceSync / 60)}m since sync`;

  const pushToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((cur) => [{ id, ...t }, ...cur].slice(0, 4));
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    // "Real" sync logic (demo): update eventsData, then toast only on NEW or meaningful escalation.
    setEventsData((prev) => {
      const next = simulateSync(prev, syncTick);

      const prevMap = new Map(prevEventsRef.current.map((e) => [e.id, e]));

      // 1) New events
      for (const e of next) {
        if (!prevMap.has(e.id)) {
          const tone: ToastTone = e.severity >= 80 ? 'danger' : e.severity >= 60 ? 'neutral' : 'good';
          pushToast({
            title: e.severity >= 80 ? 'NEW CRITICAL SIGNAL' : 'NEW SIGNAL',
            message: `${displayTitleFor(e)} — ${e.region} · sev ${e.severity}`,
            tone,
          });
          break; // one toast per sync keeps it classy
        }
      }

      // 2) Escalations
      for (const e of next) {
        const before = prevMap.get(e.id);
        if (!before) continue;

        const delta = e.severity - before.severity;
        const crossed = sevTier(before.severity) !== sevTier(e.severity) && delta > 0;
        const jumped = delta >= 10;

        if (crossed || jumped) {
          const tone: ToastTone = e.severity >= 80 ? 'danger' : e.severity >= 60 ? 'neutral' : 'good';
          pushToast({
            title: crossed ? 'ESCALATION DETECTED' : 'SIGNAL SPIKE',
            message: `${displayTitleFor(e)} — ${e.region} · ${before.severity}→${e.severity}`,
            tone,
          });
          break;
        }
      }

      prevEventsRef.current = next;
      return next;
    });
  }, [lastSyncMs, pushToast, syncTick]);

  const stats = useMemo(() => {
    const maxSeverity = eventsData.length ? Math.max(...eventsData.map((e) => e.severity)) : 0;
    const criticalCount = eventsData.filter((e) => e.severity >= 80).length;
    const last24h = eventsData.filter((e) => e.updatedMinutesAgo < 1440).length;
    const highConfidence = eventsData.filter((e) => e.confidence === 'HIGH').length;

    return { maxSeverity, criticalCount, last24h, highConfidence };
  }, [eventsData]);

  const filteredEvents = useMemo(() => {
    const filtered = eventsData.filter(e => {
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
      if (e.severity < severityThreshold) return false;
      if (confidenceFilter !== 'ALL' && e.confidence !== confidenceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const title = displayTitleFor(e).toLowerCase();
        if (!title.includes(q) && !e.region.toLowerCase().includes(q) && !e.summary.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (sortBy === 'severity') {
      filtered.sort((a, b) => b.severity - a.severity || a.updatedMinutesAgo - b.updatedMinutesAgo);
    } else {
      filtered.sort((a, b) => a.updatedMinutesAgo - b.updatedMinutesAgo || b.severity - a.severity);
    }

    return filtered;
  }, [categoryFilter, severityThreshold, confidenceFilter, searchQuery, sortBy, eventsData]);

  const categorizedEvents = useMemo(() => {
    return {
      SECURITY: filteredEvents.filter(e => e.category === 'SECURITY'),
      STATE: filteredEvents.filter(e => e.category === 'STATE'),
      MARKETS: filteredEvents.filter(e => e.category === 'MARKETS')
    };
  }, [filteredEvents]);

  const topThreat = useMemo(() => {
    const sorted = filteredEvents.slice().sort((a, b) => b.severity - a.severity || a.updatedMinutesAgo - b.updatedMinutesAgo);
    return sorted[0] ?? null;
  }, [filteredEvents]);

  useEffect(() => {
    const id = topThreat?.id ?? null;
    if (prevTopThreatIdRef.current === null) {
      prevTopThreatIdRef.current = id;
      return;
    }
    if (prevTopThreatIdRef.current !== id) {
      window.setTimeout(() => setThreatAnim('swap'), 0);
      window.setTimeout(() => setThreatAnim('idle'), 220);
      prevTopThreatIdRef.current = id;
    }
  }, [topThreat?.id]);

  return (
    <div className="min-h-screen text-zinc-100 relative overflow-hidden bg-black">
      {/* Background depth layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(16,185,129,0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_600px_at_80%_30%,rgba(59,130,246,0.06),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_500px_at_20%_60%,rgba(249,115,22,0.05),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />

      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Global style for keyframes */}
      <style jsx global>{`
        @keyframes tickerIn {
          0% {
            opacity: 0;
            transform: translate(-30px, -50%) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translate(var(--ticker-x, 0), -50%) scale(1);
          }
        }
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes labelPop {
          0% {
            opacity: 0;
            transform: translateY(2px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes labelLineIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes glitchNudge {
          0% {
            transform: translateX(0px);
          }
          25% {
            transform: translateX(-1.5px);
          }
          50% {
            transform: translateX(2px);
          }
          75% {
            transform: translateX(-1px);
          }
          100% {
            transform: translateX(0px);
          }
        }
        @keyframes pinPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.92);
            opacity: 0.1;
          }
          40% {
            opacity: 0.22;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.23);
            opacity: 0.32;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.92);
            opacity: 0.1;
          }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-emerald-400" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight">SITUATION MONITOR</h1>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-zinc-400">LIVE</span>
                    <span className="text-zinc-700">•</span>
                    <span className="font-mono">{syncLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query live intel…"
                  className="w-[320px] bg-zinc-950/70 border border-zinc-800 rounded-lg pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                />
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-800 bg-zinc-950/60 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                  /
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Total Signals"
              value={eventsData.length.toString()}
              icon={Globe}
              onClick={() => {
                setActivePreset(null);
                setCategoryFilter('ALL');
                setSeverityThreshold(0);
                setConfidenceFilter('ALL');
                setSortBy('severity');
                consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
            <StatCard
              label="Critical"
              value={stats.criticalCount.toString()}
              trend={{ value: '+2', up: true }}
              icon={TrendingUp}
              onClick={() => {
                setActivePreset('Critical');
                setCategoryFilter('ALL');
                setSeverityThreshold(80);
                setConfidenceFilter('ALL');
                setSortBy('severity');
                consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
            <StatCard
              label="Active (24h)"
              value={stats.last24h.toString()}
              icon={Clock}
              onClick={() => {
                setActivePreset('Active (24h)');
                setCategoryFilter('ALL');
                setSeverityThreshold(0);
                setConfidenceFilter('ALL');
                setSortBy('recent');
                consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
            <StatCard
              label="High Confidence"
              value={stats.highConfidence.toString()}
              trend={{ value: '+1', up: true }}
              icon={BadgeCheck}
              onClick={() => {
                setActivePreset('High Confidence');
                setCategoryFilter('ALL');
                setSeverityThreshold(0);
                setConfidenceFilter('HIGH');
                setSortBy('severity');
                consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </div>

          {topThreat && (
            <button
              type="button"
              onClick={() => {
                setSelectedEvent(topThreat);
                consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="mt-4 w-full rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-left transition-all hover:bg-zinc-950/55 hover:border-zinc-700"
            >
              <div className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-zinc-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                TOP THREAT
                <span className="text-zinc-700">•</span>
                <span className="font-mono text-zinc-400">{topThreat.region}</span>
              </div>
              <div
                className={
                  'mt-1 flex items-center justify-between gap-4 transition-all duration-200 ' +
                  (threatAnim === 'swap' ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0')
                }
              >
                <div className="text-sm text-zinc-100">
                  <span className="font-medium">{displayTitleFor(topThreat)}</span>
                  <span className="text-zinc-600"> — </span>
                  <span className="text-zinc-400">{topThreat.summary}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded border border-zinc-800 bg-black/40 px-2 py-1 text-xs font-mono text-zinc-300">
                    sev {topThreat.severity}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Hero map */}
      <HeroMap
        events={filteredEvents}
        worldThreat={stats.maxSeverity}
        onSelectEvent={(e) => setSelectedEvent(e)}
        pulse={mapPulse}
        rightOverlay={
          <LiveSignalFeed events={eventsData} mode="ticker" maxCards={4} onSignal={onFeedSignal} />
        }
      />

      {/* Console */}
      <div ref={consoleRef} className="relative z-10 -mt-[34vh]">
        <div className="h-10 w-full bg-gradient-to-b from-transparent to-black" />
        <div className="max-w-[1600px] mx-auto px-6 pb-6">
          <div
            className={
              'rounded-2xl border bg-black/70 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ' +
              (stats.maxSeverity >= 80
                ? 'border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.10)]'
                : 'border-zinc-900/80')
            }
          >
            <div className="p-6">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-9 gap-4">
                  <div className="col-span-3">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as Category | 'ALL')}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="SECURITY">Security</option>
                      <option value="STATE">State</option>
                      <option value="MARKETS">Markets</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Min Severity</label>
                    <select
                      value={severityThreshold}
                      onChange={(e) => setSeverityThreshold(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                    >
                      <option value="0">All (0+)</option>
                      <option value="40">Watch (40+)</option>
                      <option value="60">Elevated (60+)</option>
                      <option value="80">Critical (80+)</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'severity' | 'recent')}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                    >
                      <option value="severity">Severity (High to Low)</option>
                      <option value="recent">Most Recent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Showing {filteredEvents.length} of {eventsData.length} events
                    {confidenceFilter !== 'ALL' ? ` · Confidence: ${confidenceFilter}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {activePreset && (
                      <button
                        type="button"
                        onClick={() => {
                          setActivePreset(null);
                          setCategoryFilter('ALL');
                          setSeverityThreshold(0);
                          setConfidenceFilter('ALL');
                          setSortBy('severity');
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-[11px] font-mono text-zinc-300 hover:border-zinc-700"
                      >
                        <span className="text-zinc-500">PRESET</span>
                        <span className="text-zinc-200">{activePreset}</span>
                        <span className="text-zinc-600">×</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <LiveSignalFeed events={eventsData} onSignal={onFeedSignal} />

              <div className="grid grid-cols-3 gap-6">
                {(['SECURITY', 'STATE', 'MARKETS'] as Category[]).map((cat) => {
                  const config = categoryConfig[cat];
                  const events = categorizedEvents[cat];

                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-4">
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                        <h2 className="text-lg font-semibold">{config.label}</h2>
                        <span className="ml-auto text-sm text-zinc-500">{events.length}</span>
                      </div>

                      <div className="space-y-3">
                        {events.length === 0 ? (
                          <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-600 text-sm">
                            No events match current filters
                          </div>
                        ) : (
                          events.map((event) => (
                            <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = categoryConfig[selectedEvent.category].icon;
                  const config = categoryConfig[selectedEvent.category];
                  return (
                    <div className={`p-3 rounded-lg ${config.bg} ${config.border} border`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">{displayTitleFor(selectedEvent)}</h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-zinc-400">{selectedEvent.region}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-zinc-400">Updated {selectedEvent.updatedMinutesAgo}m ago</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-500 hover:text-zinc-300 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-3">Assessment</h3>
                <p className="text-zinc-200 leading-relaxed">{selectedEvent.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Severity</div>
                  <div className="text-3xl font-bold text-zinc-100 mb-2">{selectedEvent.severity}</div>
                  <SeverityBar severity={selectedEvent.severity} />
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Confidence</div>
                  {(() => {
                    const conf = confidenceConfig[selectedEvent.confidence];
                    const Icon = conf.icon;
                    return (
                      <div className={`inline-flex items-center gap-2 text-2xl font-bold ${conf.color}`}>
                        <Icon className="w-6 h-6" />
                        {conf.label}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Momentum</div>
                <div className="flex items-center gap-3">
                  <MomentumIndicator momentum={selectedEvent.momentum} />
                  <span className="text-zinc-300">
                    {selectedEvent.momentum === 'UP'
                      ? 'Intensifying'
                      : selectedEvent.momentum === 'DOWN'
                        ? 'Easing'
                        : 'Sustained'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toasts items={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />
    </div>
  );
}