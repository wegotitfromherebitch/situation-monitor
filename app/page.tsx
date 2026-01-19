"use client";

import { useState } from "react";
import { GlassCard } from "./components/GlassCard";
import { Activity, Globe, ShieldAlert, Radio, AlertTriangle, Zap } from "lucide-react";
import { useSignals } from "./lib/useSignals";
import { GlobalMap } from "./components/GlobalMap";
import { DetailPane } from "./components/DetailPane";
import { EventItem, displayTitleFor } from "./lib/events";
import { cn } from "./lib/utils";

// Helper to calculate DEFCON level from severity (0-100)
const getDefconLevel = (severity: number) => {
  if (severity >= 90) return { level: 1, color: "text-red-600", bg: "bg-red-500", border: "border-red-500" };
  if (severity >= 75) return { level: 2, color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-500" };
  if (severity >= 50) return { level: 3, color: "text-amber-400", bg: "bg-amber-400", border: "border-amber-400" };
  if (severity >= 25) return { level: 4, color: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-400" };
  return { level: 5, color: "text-emerald-600", bg: "bg-emerald-600", border: "border-emerald-600" };
};

export default function Home() {
  const { events, isLoading, lastUpdated } = useSignals({ interval: 10000 });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Derived Data
  const maxSeverity = events.length > 0 ? Math.max(...events.map(e => e.severity)) : 0;
  const threat = getDefconLevel(maxSeverity);

  // Stats
  const criticalThreats = events.filter(e => e.severity >= 75).length;
  const activeZones = new Set(events.map(e => e.region)).size;

  // Sort events for the feed
  const feedEvents = [...events]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 15); // Show more events since we have a scroller

  return (
    <main className="min-h-screen p-2 md:p-4 bg-[#020202] text-zinc-100 font-mono selection:bg-emerald-500/30 overflow-hidden flex flex-col">

      {/* Detail View Overlay */}
      <DetailPane
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onAction={(action, event) => console.log('Action:', action, event.id)}
      />

      {/* 1. TOP STATUS BAR (Dense, small text) */}
      <header className="mb-2 shrink-0 flex justify-between items-center border-b border-white/10 pb-2 px-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm animate-pulse" />
            SITUATION<span className="text-zinc-600">MONITOR</span>
          </h1>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="text-[10px] text-zinc-500 tracking-widest uppercase hidden sm:block">
            SECURE CHANNEL: <span className="text-emerald-500">ENCRYPTED</span>
          </div>
        </div>
        <div className="flex gap-4 text-[10px] text-zinc-500 font-mono">
          <span className="hidden md:inline">LAT: 34.0522 N</span>
          <span className="hidden md:inline">LON: 118.2437 W</span>
          <span className="text-emerald-500">{isLoading ? "SYS: UPLINKING..." : "SYS: NORMAL"}</span>
        </div>
      </header>

      {/* 2. THE STAT ROW (Restoring the density from Screenshot 1) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 shrink-0">
        {[
          { label: "TOTAL SIGNALS", val: events.length.toString(), icon: Radio, color: "text-white" },
          { label: "CRITICAL THREATS", val: criticalThreats.toString(), icon: AlertTriangle, color: "text-rose-500" },
          { label: "ACTIVE ZONES", val: activeZones.toString(), icon: Globe, color: "text-amber-500" },
          { label: "SYSTEM LATENCY", val: "24ms", icon: Zap, color: "text-emerald-400" },
        ].map((stat, i) => (
          <GlassCard
            key={i}
            variant="hud"
            className="h-16 md:h-20 flex items-center px-4 cursor-pointer hover:bg-white/5 active:scale-95 transition-all group"
            delay={0.1 + (i * 0.05)}
            onClick={() => console.log(`Clicked ${stat.label}`)}
          >
            <div className="flex justify-between items-center w-full">
              <div>
                <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 md:mb-1 group-hover:text-emerald-500 transition-colors">{stat.label}</div>
                <div className={`text-xl md:text-2xl font-bold leading-none ${stat.color} group-hover:text-white transition-colors`}>{stat.val}</div>
              </div>
              <stat.icon className={`w-4 h-4 ${stat.color} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 3. MAIN GRID (Asymmetrical & Dense) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1 min-h-0">

        {/* LEFT: MAIN MAP (Spans 9 cols) */}
        <GlassCard variant="hud" className="col-span-1 md:col-span-9 relative group p-0 min-h-[300px] md:min-h-0" delay={0.2}>
          {/* Map Header Overlay */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="text-xs text-emerald-500 border border-emerald-500/30 px-2 py-1 bg-black/50 backdrop-blur-sm inline-block mb-1 font-mono tracking-wider">
              LIVE SATELLITE FEED
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">SECTOR 4 // NORTH ATLANTIC</div>
          </div>

          {/* The Actual Map */}
          <div className="absolute inset-0 bg-zinc-950">
            <GlobalMap
              events={events}
              onEventClick={setSelectedEvent}
              className="w-full h-full border-none bg-transparent rounded-none"
            />
          </div>
        </GlassCard>

        {/* RIGHT: INTEL COLUMN (Spans 3 cols) */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-2 min-h-[300px] md:min-h-0">

          {/* THREAT LEVEL */}
          <GlassCard variant="hud" className="h-24 md:h-32 flex flex-col justify-center items-center text-center shrink-0" delay={0.3}>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">Current Defcon</div>
            <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter relative inline-block">
              {threat.level}
              <span className={cn("absolute -top-2 -right-6 text-[10px] md:text-xs font-normal text-black px-1 rounded-sm font-mono", threat.bg)}>
                {threat.level === 1 ? 'CRIT' : threat.level <= 3 ? 'HIGH' : 'LOW'}
              </span>
            </div>
          </GlassCard>

          {/* INTEL FEED (High Density List) */}
          <GlassCard variant="hud" className="flex-1 overflow-hidden flex flex-col min-h-0" delay={0.4}>
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2 shrink-0">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-white tracking-widest uppercase font-mono">Signal Feed</span>
            </div>

            <div className="space-y-0 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {isLoading && events.length === 0 ? (
                <div className="text-[10px] text-zinc-500 font-mono p-2">Initializing encryption layers...</div>
              ) : (
                feedEvents.map((item, i) => (
                  <div
                    key={item.id}
                    className="group relative pl-3 border-l border-zinc-800 hover:border-emerald-500 transition-colors py-2 cursor-pointer hover:bg-white/5"
                    onClick={() => setSelectedEvent(item)}
                  >
                    <div className="flex justify-between items-start pr-2">
                      <div className="text-[9px] text-zinc-500 mb-0.5 font-mono truncate max-w-[70%]">
                        09:4{i} // {item.category}
                      </div>
                      {item.severity > 75 && (
                        <span className="text-[8px] text-red-500 font-mono border border-red-500/30 px-1 rounded">ALERT</span>
                      )}
                    </div>
                    <div className="text-[10px] md:text-[11px] leading-snug text-zinc-300 group-hover:text-white transition-colors font-mono">
                      {displayTitleFor(item)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

        </div>
      </div>
    </main>
  );
}