"use client";

import { useState, useEffect, useCallback } from 'react';
import { EVENTS, type EventItem, type Category, displayTitleFor } from './lib/events';
import { simulateSync } from './lib/simulation';
import { LiveSignalFeed, type LiveSignal } from './components/LiveSignalFeed';
import { Toasts, type ToastItem } from './components/Toasts';
import { AppHeader } from './components/AppHeader';
import { StatsRow } from './components/StatsRow';
import { ThreatPanel } from './components/ThreatPanel';
import { EventList } from './components/EventList';
import { GlobalMap } from './components/GlobalMap';
import { SystemStatus } from './components/SystemStatus';
import { DetailPane } from './components/DetailPane';
import { FilterDrawer, type FilterType } from './components/FilterDrawer';
import { KeyboardHints } from './components/KeyboardHints';
import { useSignals } from './lib/useSignals';

export default function Dashboard() {
  const { events: liveEvents, isLoading: isSignalsLoading } = useSignals({
    interval: 30000,
    useMockFallback: false
  });

  const [events, setEvents] = useState<EventItem[]>(EVENTS);
  const [ticks, setTicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | Category>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  // Sync live events to local state
  useEffect(() => {
    if (liveEvents.length > 0) {
      setEvents(liveEvents);
    }
  }, [liveEvents]);

  // "Hydrate" effect
  useEffect(() => {
    setLoading(false);
  }, []);

  // Simulation effect - use functional updates to avoid stale closure
  useEffect(() => {
    const interval = setInterval(() => {
      setTicks((t) => {
        setEvents((prev) => simulateSync(prev, t + 1));
        return t + 1;
      });
    }, 8500); // 8.5s heartbeat
    return () => clearInterval(interval);
  }, []); // Empty deps - interval runs once

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }].slice(-4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const handleSignal = useCallback((s: LiveSignal) => {
    if (s.type === 'escalation') {
      addToast({
        title: 'ESCALATION ALERT',
        message: `${displayTitleFor(s.event)} in ${s.event.region} spiked by ${s.delta} points.`,
        tone: 'danger',
      });
    } else if (s.type === 'new') {
      addToast({
        title: 'NEW SIGNAL',
        message: `New activity detected: ${s.event.region} (${s.event.category})`,
        tone: 'neutral',
      });
    }
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEventClick = (event: EventItem) => {
    setSelectedEvent(event);
  };

  const handleFilter = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Largest threat for panel
  const topThreat = [...events].sort((a, b) => b.severity - a.severity)[0];

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-600 font-mono">INITIALIZING UPLINK...</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden">

      <Toasts items={toasts} onDismiss={removeToast} />

      {/* Detail View for Clicked Event */}
      <DetailPane
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onAction={(action, event) => {
          if (action === 'report') {
            addToast({
              title: 'REPORT GENERATED',
              message: `Intelligence brief for ${displayTitleFor(event)} is ready for download.`,
              tone: 'success',
            });
          } else if (action === 'uplink') {
            addToast({
              title: 'UPLINK SYNCHRONIZED',
              message: `Signal relay for ${event.region} sector established.`,
              tone: 'success',
            });
          }
        }}
      />

      {/* Filter Drawer for Stat Cards */}
      <FilterDrawer
        filter={activeFilter}
        events={events}
        onClose={() => setActiveFilter(null)}
        onEventClick={handleEventClick}
      />

      {/* Keyboard Hints */}
      <KeyboardHints />

      <AppHeader ticks={ticks} events={events} />

      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="flex flex-col gap-6">

          <StatsRow events={events} setActiveTab={setActiveTab} onFilter={handleFilter} />

          {/* Ticker Feed - Full Width */}
          <LiveSignalFeed
            events={events}
            onSignal={handleSignal}
            onCardClick={handleEventClick}
            mode="ticker"
            maxCards={6}
            className="w-full"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

            {/* Main Stage: Map (Hero) */}
            <div className="lg:col-span-3 relative">
              <GlobalMap
                events={events}
                onEventClick={handleEventClick}
                className="min-h-[750px] w-full shadow-2xl shadow-emerald-900/5 sm:h-[80vh] border border-white/5 rounded-3xl overflow-hidden bg-zinc-900/20"
              />
            </div>

            {/* Right Command Rail */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
              <ThreatPanel topThreat={topThreat} />

              <SystemStatus />

              <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
                <EventList
                  events={events}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onEventClick={handleEventClick}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}