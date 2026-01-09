"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Globe, DollarSign, Search, ChevronRight, Activity, Clock, Zap, BadgeCheck, CircleDashed } from 'lucide-react';
import { EVENTS, type EventItem, type Category, displayTitleFor, sevTier } from './lib/events';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
  icon: any;
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
    <div className="fixed bottom-5 right-5 z-[60] flex w-[360px] max-w-[92vw] flex-col gap-2">
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

function LiveSignalFeed({ events }: { events: EventItem[] }) {
  const [signals, setSignals] = useState<LiveSignal[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [now, setNow] = useState<number>(0); // set on client to avoid hydration mismatch

  const feedRef = useRef<HTMLDivElement>(null);
  const prevMapRef = useRef<Map<string, EventItem>>(new Map());
  const initializedRef = useRef(false);

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

      setSignals((cur) => [...batch, ...cur].slice(0, 25));
      requestAnimationFrame(() => {
        feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    prevMapRef.current = new Map(events.map((e) => [e.id, { ...e }]));
  }, [events, isPaused]);

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
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

// Simple equirectangular projection into the 1000×520 overlay.
// It’s not fancy like Natural Earth, but it is geo-correct enough for our stylized map.
function projectLonLatToMap({ lon, lat }: LatLon): MapPoint {
  // normalize
  const x01 = clamp01((lon + 180) / 360);
  const y01 = clamp01((90 - lat) / 180);

  // fit to our viewBox; leave tiny top/bottom margins for nicer aesthetics
  const W = 1000;
  const H = 520;
  const topPad = 12;
  const botPad = 18;

  return {
    x: x01 * W,
    y: topPad + y01 * (H - topPad - botPad),
  };
}

function regionToLatLon(region: string): LatLon {
  const r = region.toLowerCase().trim();

  // Countries (quick hits if you later switch region strings to country names)
  if (r.includes('venezuela')) return { lat: 7.0, lon: -66.0 };
  if (r.includes('colombia')) return { lat: 4.6, lon: -74.1 };
  if (r.includes('ukraine')) return { lat: 49.0, lon: 31.0 };
  if (r.includes('russia')) return { lat: 55.0, lon: 37.0 };
  if (r.includes('israel')) return { lat: 31.0, lon: 35.0 };
  if (r.includes('iran')) return { lat: 32.0, lon: 53.0 };
  if (r.includes('china')) return { lat: 35.0, lon: 103.0 };
  if (r.includes('taiwan')) return { lat: 23.7, lon: 121.0 };
  if (r.includes('japan')) return { lat: 36.0, lon: 138.0 };
  if (r.includes('korea')) return { lat: 36.5, lon: 127.8 };
  if (r.includes('india')) return { lat: 22.0, lon: 79.0 };
  if (r.includes('saudi')) return { lat: 24.0, lon: 45.0 };
  if (r.includes('egypt')) return { lat: 26.8, lon: 30.8 };
  if (r.includes('nigeria')) return { lat: 9.1, lon: 8.7 };

  // Regions (your current demo data)
  if (r.includes('middle east')) return { lat: 29.5, lon: 45.0 };
  if (r.includes('eastern europe')) return { lat: 50.2, lon: 30.5 };
  if (r === 'europe' || r.includes('western europe')) return { lat: 48.8, lon: 8.0 };

  if (r.includes('north america') || r.includes('u.s') || r.includes('us') || r.includes('canada')) {
    return { lat: 39.0, lon: -98.0 };
  }

  if (r.includes('south america') || r.includes('latam') || r.includes('latin america')) {
    return { lat: -15.0, lon: -60.0 };
  }

  if (r.includes('africa')) return { lat: 6.0, lon: 20.0 };

  if (r.includes('asia pacific') || r.includes('apac')) return { lat: 15.0, lon: 125.0 };
  if (r.includes('southeast asia') || r === 'sea') return { lat: 10.0, lon: 105.0 };
  if (r.includes('east asia')) return { lat: 35.0, lon: 120.0 };
  if (r.includes('south asia')) return { lat: 22.0, lon: 80.0 };
  if (r.includes('asia')) return { lat: 25.0, lon: 100.0 };

  if (r === 'em' || r.includes('emerging')) return { lat: 20.0, lon: 95.0 };

  // Global / fallback -> Gulf of Guinea (looks centered and avoids ocean-only vibes)
  return { lat: 0.0, lon: 10.0 };
}

function regionToPoint(region: string): MapPoint {
  return projectLonLatToMap(regionToLatLon(region));
}

function sevColor(sev: number) {
  if (sev >= 80) return { ring: "rgba(239,68,68,0.9)", fill: "rgba(239,68,68,0.35)" };
  if (sev >= 60) return { ring: "rgba(249,115,22,0.9)", fill: "rgba(249,115,22,0.30)" };
  if (sev >= 40) return { ring: "rgba(234,179,8,0.9)", fill: "rgba(234,179,8,0.28)" };
  return { ring: "rgba(16,185,129,0.9)", fill: "rgba(16,185,129,0.26)" };
}

// Replace your HeroMap function with this enhanced tactical version
function HeroMap({
  events,
  worldThreat,
  onSelectEvent,
}: {
  events: EventItem[];
  worldThreat: number;
  onSelectEvent: (event: EventItem) => void;
}) {
  const [worldSvg, setWorldSvg] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ id: string; p: MapPoint } | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(
    new Set(['SECURITY', 'STATE', 'MARKETS'])
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/world.svg")
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => {
        if (cancelled) return;
        if (t && t.includes("<svg")) setWorldSvg(t);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Filter by active categories and show top 12 events
  const pins = useMemo(() => {
    const filtered = events
      .filter(e => activeCategories.has(e.category))
      .slice()
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 12);

    return filtered.map((e, idx) => ({
      e,
      p: regionToPoint(e.region),
      c: sevColor(e.severity),
      primary: idx === 0,
    }));
  }, [events, activeCategories]);

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
      <div className="sticky top-0 z-0 h-[72vh] min-h-[560px]">
        <div className="absolute inset-0 bg-black">
          {/* Keep your existing vignette and grid */}
          <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_10%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_60%_40%,rgba(16,185,129,0.07),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_35%_55%,rgba(249,115,22,0.06),transparent_60%)]" />

          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          {/* Map */}
          <div className="absolute inset-0">
            {worldSvg ? (
              <div className="absolute inset-0 opacity-[0.16] pointer-events-none [mask-image:radial-gradient(900px_520px_at_50%_45%,black,transparent_72%)]">
                <div
                  className="absolute inset-0 [&_svg]:w-full [&_svg]:h-full [&_svg]:block [&_svg]:opacity-100 [&_svg_path]:fill-[rgba(16,185,129,0.10)] [&_svg_path]:stroke-[rgba(16,185,129,0.18)] [&_svg_path]:stroke-[0.6]"
                  dangerouslySetInnerHTML={{ __html: worldSvg }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 text-zinc-600 flex items-center justify-center text-sm">
                world.svg not loaded
              </div>
            )}

            {/* Enhanced tactical SVG overlay */}
            <svg
              viewBox="0 0 1000 520"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid slice"
            >
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
              </defs>

              {/* Connection lines */}
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

              {/* Enhanced pins with tactical labels */}
              <g filter="url(#tactical-glow)">
                {pins.map(({ e, p, c, primary }) => {
                  const isHovered = hoveredPin?.id === e.id;
                  const showLabel = primary || isHovered;
                  // 1) Reduce pin sizing
                  const pinSize = primary ? 12 : isHovered ? 10 : 8;
                  return (
                    <g
                      key={e.id}
                      onMouseEnter={() => setHoveredPin({ id: e.id, p })}
                      onMouseLeave={() => setHoveredPin(null)}
                      onClick={() => onSelectEvent(e)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Outer glow field */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={primary ? 22 : 14}
                        fill={c.fill}
                        opacity={primary ? 0.16 : 0.10}
                      />

                      {/* Animated breathing ring */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={pinSize + 2}
                        fill="none"
                        stroke={c.ring}
                        strokeWidth={primary ? 2 : 1.25}
                        opacity={primary ? 0.85 : 0.50}
                      >
                        <animate
                          attributeName="r"
                          values={`${pinSize + 1};${pinSize + 4};${pinSize + 1}`}
                          dur={primary ? "2.4s" : "3.8s"}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values={primary ? "0.65;1;0.65" : "0.35;0.6;0.35"}
                          dur={primary ? "2.4s" : "3.8s"}
                          repeatCount="indefinite"
                        />
                      </circle>

                      {/* Core pin */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={pinSize}
                        fill="rgba(0,0,0,0.85)"
                        stroke={c.ring}
                        strokeWidth={1.6}
                      />

                      {/* Inner indicator */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={pinSize * 0.40}
                        fill={c.ring}
                        opacity={0.9}
                      />

                      {/* Tactical label (severity + region) */}
                      {showLabel && (
                        <>
                          {/* Tooltip container */}
                          <rect
                            x={p.x + pinSize + 6}
                            y={p.y - (isHovered ? 22 : 9)}
                            width={isHovered ? 170 : 78}
                            height={isHovered ? 34 : 18}
                            fill="rgba(0,0,0,0.92)"
                            stroke={c.ring}
                            strokeWidth={0.6}
                            rx={3}
                          />

                          {/* Connector */}
                          <line
                            x1={p.x + pinSize}
                            y1={p.y}
                            x2={p.x + pinSize + 6}
                            y2={p.y}
                            stroke={c.ring}
                            strokeWidth={0.6}
                            opacity={0.65}
                          />

                          {/* Row 1: severity + region */}
                          <text
                            x={p.x + pinSize + 12}
                            y={p.y - (isHovered ? 8 : -0)}
                            fill={c.ring}
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {e.severity}
                          </text>
                          <text
                            x={p.x + pinSize + 34}
                            y={p.y - (isHovered ? 8 : -0)}
                            fill="rgba(255,255,255,0.62)"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {e.region.toUpperCase()}
                          </text>

                          {/* Row 2: title snippet (hover only) */}
                          {isHovered && (
                            <text
                              x={p.x + pinSize + 12}
                              y={p.y + 10}
                              fill="rgba(255,255,255,0.72)"
                              fontSize="9"
                              fontFamily="monospace"
                            >
                              {displayTitleFor(e).slice(0, 28).toUpperCase()}{displayTitleFor(e).length > 28 ? '…' : ''}
                            </text>
                          )}
                        </>
                      )}

                      <title>{`${displayTitleFor(e)} • ${e.region} • sev ${e.severity}`}</title>
                    </g>
                  );
                })}
              </g>
            </svg>
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

          {/* Enhanced tactical legend with category filters */}
          <div className="absolute right-6 top-6 pointer-events-auto">
            <div className="rounded-lg border border-zinc-800/60 bg-black/50 backdrop-blur-md px-3 py-2.5 space-y-3">
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
          </div>

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
        const isTyping = tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable;
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
    let filtered = eventsData.filter(e => {
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
      setThreatAnim('swap');
      window.setTimeout(() => setThreatAnim('idle'), 220);
      prevTopThreatIdRef.current = id;
    }
  }, [topThreat?.id]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Grid background */}
      <div 
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />
      <style jsx global>{`
        @keyframes radar {
          0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.10; }
          40% { opacity: 0.22; }
          100% { transform: translate(-50%, -50%) scale(1.18); opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-emerald-400" />
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
              {/* Command search (compact, always available) */}
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
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-800 bg-zinc-950/60 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">/</div>
              </div>
              {/* Removed RiskGauge from header right */}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Total Signals"
              value={eventsData.length.toString()}
              icon={Activity}
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
              icon={AlertTriangle}
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
              icon={Zap}
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
                  "mt-1 flex items-center justify-between gap-4 transition-all duration-200 " +
                  (threatAnim === 'swap' ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0')
                }
              >
                <div className="text-sm text-zinc-100">
                  <span className="font-medium">{displayTitleFor(topThreat)}</span>
                  <span className="text-zinc-600"> — </span>
                  <span className="text-zinc-400">{topThreat.summary}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded border border-zinc-800 bg-black/40 px-2 py-1 text-xs font-mono text-zinc-300">sev {topThreat.severity}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </button>
          )}
        </div>
      </header>
      
      {/* Hero map intro */}
      <HeroMap
        events={filteredEvents}
        worldThreat={stats.maxSeverity}
        onSelectEvent={(e) => setSelectedEvent(e)}
      />

      {/* Console (glides over map) */}
      <div ref={consoleRef} className="relative z-10 -mt-[34vh]">
        <div className="h-10 w-full bg-gradient-to-b from-transparent to-black" />
        <div className="max-w-[1600px] mx-auto px-6 pb-6">
          <div className={
            "rounded-2xl border bg-black/70 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)] " +
            (stats.maxSeverity >= 80
              ? "border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.10)]"
              : "border-zinc-900/80")
          }>
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
                  title="Clear preset"
                >
                  <span className="text-zinc-500">PRESET</span>
                  <span className="text-zinc-200">{activePreset}</span>
                  <span className="text-zinc-600">×</span>
                </button>
              )}
              <span className="text-zinc-600">Tip: press <span className="font-mono text-zinc-400">/</span> to search</span>
            </div>
          </div>
        </div>
        
        <LiveSignalFeed events={eventsData} />
        {/* Event Grid */}
        <div className="grid grid-cols-3 gap-6">
          {(['SECURITY', 'STATE', 'MARKETS'] as Category[]).map(cat => {
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
                    events.map(event => (
                      <EventCard 
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                      />
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
                  <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                    {displayTitleFor(selectedEvent)}
                  </h2>
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
                    {selectedEvent.momentum === 'UP' ? 'Intensifying' : selectedEvent.momentum === 'DOWN' ? 'Easing' : 'Sustained'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toasts
        items={toasts}
        onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))}
      />
    </div>
  );
}