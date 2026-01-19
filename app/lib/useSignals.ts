'use client';

import { useState, useEffect, useCallback } from 'react';
import { type EventItem, EVENTS } from './events';

interface UseSignalsOptions {
    /** Polling interval in milliseconds. Default: 60000 (1 minute) */
    interval?: number;
    /** Whether to start with mock data before real data loads */
    useMockFallback?: boolean;
}

interface UseSignalsReturn {
    events: EventItem[];
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
}

export function useSignals(options: UseSignalsOptions = {}): UseSignalsReturn {
    const { interval = 60000, useMockFallback = true } = options;

    const [events, setEvents] = useState<EventItem[]>(useMockFallback ? EVENTS : []);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // SMARTER SEVERITY CALCULATOR
    const getSmartSeverity = (text: string, baseSeverity: number): number => {
        const t = text.toLowerCase();

        // Tier 1: Existential / Catastrophic
        if (t.includes('nuclear') || t.includes('biohazard') || t.includes('pandemic') || t.includes('mass casualty')) return Math.max(baseSeverity, 95);

        // Tier 2: Kinetic / Critical
        if (t.includes('war') || t.includes('invasion') || t.includes('airstrike') || t.includes('explosion') || t.includes('assassination')) return Math.max(baseSeverity, 85);

        // Tier 3: High Tension / Cyber
        if (t.includes('crisis') || t.includes('emergency') || t.includes('cyber') || t.includes('ransomware') || t.includes('breach')) return Math.max(baseSeverity, 75);

        // Tier 4: Unrest / Economic
        if (t.includes('protest') || t.includes('riot') || t.includes('crash') || t.includes('sanctions')) return Math.max(baseSeverity, 65);

        return baseSeverity;
    };

    const fetchSignals = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/signals');

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.events?.length > 0) {
                // Merge real events (for lists/tickers) with hardcoded Map events
                const realEvents: EventItem[] = data.events.map((e: any) => ({
                    ...e,
                    baseTitle: e.title || 'Unknown Signal',
                    titleOverride: e.title || 'Unknown Signal',
                    category: e.category.toUpperCase(),
                    // Smart Severity Upgrade
                    severity: getSmartSeverity((e.title || '') + ' ' + (e.summary || ''), e.severity || 30),
                    // DO NOT generate random coordinates. Map users only want verified locations.
                    // If lat/lng is 0/0, we leave coordinates undefined/invalid so they don't show on map.
                    coordinates: (e.lat && e.lng) ? [e.lat, e.lng] : undefined
                }));

                // Always preserve the high-quality hardcoded "Points of Interest" for the map
                setEvents([...EVENTS, ...realEvents]);
                setError(null);
            } else if (useMockFallback) {
                setEvents(EVENTS);
            }

            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch signals:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');

            // Fall back to mock data on error
            if (useMockFallback && events.length === 0) {
                setEvents(EVENTS);
            }
        } finally {
            setIsLoading(false);
        }
    }, [useMockFallback, events.length]);

    // Initial fetch
    useEffect(() => {
        fetchSignals();
    }, [fetchSignals]);

    // Polling
    useEffect(() => {
        if (interval <= 0) return;

        const timer = setInterval(() => {
            fetchSignals();
        }, interval);

        return () => clearInterval(timer);
    }, [interval, fetchSignals]);

    return {
        events,
        isLoading,
        error,
        lastUpdated,
        refresh: fetchSignals
    };
}
