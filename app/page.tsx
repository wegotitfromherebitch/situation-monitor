"use client";

import { useState } from "react";
import { GlassCard } from "./components/GlassCard";
import { Activity, Globe, Newspaper, TrendingUp, ShieldAlert, Zap } from "lucide-react";
import { useSignals } from "./lib/useSignals";
import { GlobalMap } from "./components/GlobalMap";
import { DetailPane } from "./components/DetailPane";
import { EventItem, displayTitleFor } from "./lib/events";
import { cn } from "./lib/utils";

// Helper to calculate DEFCON level from severity (0-100)
const getDefconLevel = (severity: number) => {
  if (severity >= 90) return { level: 1, color: "text-red-600" };
  if (severity >= 75) return { level: 2, color: "text-orange-500" };
  if (severity >= 50) return { level: 3, color: "text-amber-400" };
  if (severity >= 25) return { level: 4, color: "text-emerald-400" };
  return { level: 5, color: "text-emerald-600" };
};

export default function Home() {
  const { events, isLoading, lastUpdated } = useSignals({ interval: 10000 });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Derived Data
  const maxSeverity = events.length > 0 ? Math.max(...events.map(e => e.severity)) : 0;
  const threat = getDefconLevel(maxSeverity);

  // Find a market event for the widget, if any
  const marketEvent = events.find(e => e.category === 'MARKETS');

  // Sort events for the feed (Newest/Highest Severity mix)
  const feedEvents = [...events]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 4);

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 font-sans selection:bg-emerald-500/30">

      {/* Detail View Overlay */}
      <DetailPane
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onAction={(action, event) => console.log('Action:', action, event.id)}
      />

      {/* Header */}
      <header className="mb-8 flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            SITUATION <span className="text-zinc-500">MONITOR</span>
          </h1>
          <p className="text-emerald-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {isLoading ? "INITIALIZING UPLINK..." : "SYSTEM ONLINE"}
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-zinc-500 font-mono text-xs">V.2.0.1 // SECURE</div>
        </div>
      </header>

      {/* The Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[180px]">

        {/* 1. Main Map / Situation Area (Large) */}
        <GlassCard className="md:col-span-3 md:row-span-3 min-h-[500px] p-0 overflow-hidden relative group" delay={0.1}>
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <h2 className="text-zinc-400 font-mono text-xs tracking-widest flex items-center gap-2 bg-black/50 backdrop-blur px-2 py-1 rounded border border-white/10">
              <Globe className="w-4 h-4" /> GLOBAL THEATER
            </h2>
          </div>

          {/* Map Component - Full Fill */}
          <div className="w-full h-full relative">
            <GlobalMap
              events={events}
              onEventClick={setSelectedEvent}
              className="w-full h-full border-none bg-transparent rounded-none"
            />
          </div>
        </GlassCard>

        {/* 2. Quick Stat (Threat Level) */}
        <GlassCard delay={0.2} className="flex flex-col justify-center relative overflow-hidden">
          <h2 className="text-zinc-500 font-mono text-xs mb-1 uppercase flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" /> Threat Level
          </h2>
          <div className="text-4xl font-bold text-white font-mono tracking-tighter flex items-baseline gap-1">
            DEF<span className={cn("transition-colors duration-500", threat.color)}>{threat.level}</span>
          </div>

          {/* Decorative background pulse based on threat */}
          <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none", threat.color.replace('text-', 'bg-'))} />
        </GlassCard>

        {/* 3. Markets (Small) */}
        <GlassCard delay={0.3} className="flex flex-col justify-center">
          <h2 className="text-zinc-500 font-mono text-xs mb-1 uppercase flex gap-2">
            <TrendingUp className="w-3 h-3" /> Markets
          </h2>
          {marketEvent ? (
            <>
              <div className="text-lg font-mono text-white leading-tight mt-1 line-clamp-1">
                {marketEvent.titleOverride || "MARKET ACTIVITY"}
              </div>
              <div className={cn("text-2xl font-mono mt-1", marketEvent.severity > 50 ? "text-red-400" : "text-emerald-400")}>
                {marketEvent.severity > 50 ? "-" : "+"}{(marketEvent.severity / 20).toFixed(1)}%
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-mono text-white">
                SPX <span className="text-emerald-400 text-lg">+0.0%</span>
              </div>
              <div className="text-xs text-zinc-600 font-mono mt-1">NO DATA STREAM</div>
            </>
          )}
        </GlassCard>

        {/* 4. News Feed (Tall) */}
        <GlassCard className="md:col-span-1 md:row-span-2 overflow-y-auto custom-scrollbar" delay={0.4}>
          <h2 className="text-zinc-400 font-mono text-xs tracking-widest mb-4 flex items-center gap-2 sticky top-0 bg-zinc-900/90 backdrop-blur py-2 z-10 -mx-2 px-2 border-b border-white/5">
            <Newspaper className="w-4 h-4" /> INTEL FEED
          </h2>
          <div className="space-y-4 pb-2">
            {feedEvents.length > 0 ? (
              feedEvents.map((event) => (
                <div
                  key={event.id}
                  className="group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                      event.category === 'SECURITY' ? "text-red-400 border-red-500/20 bg-red-500/10" :
                        event.category === 'CYBER' ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10" :
                          "text-zinc-400 border-zinc-500/20 bg-zinc-500/10"
                    )}>
                      {event.category}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {event.region}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 group-hover:text-white transition-colors leading-snug">
                    {displayTitleFor(event)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-600 font-mono text-center py-8">
                ACQUIRING SIGNAL...
              </div>
            )}
          </div>
        </GlassCard>

        {/* 5. System Log (Wide Bottom) */}
        <GlassCard className="md:col-span-4 min-h-[60px] flex items-center" delay={0.5}>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 w-full">
            <Activity className="w-4 h-4 text-zinc-700" />
            <span className="animate-pulse">{isLoading ? "ESTABLISHING CONNECTION..." : "DATALINK ACTIVE"}</span>
            <span className="hidden md:inline text-zinc-700">|</span>
            <span className="hidden md:inline">
              LAST PACKET: {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--:--"}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{events.length} SIGNALS TRACKED</span>
            </div>
          </div>
        </GlassCard>

      </div>
    </main>
  );
}