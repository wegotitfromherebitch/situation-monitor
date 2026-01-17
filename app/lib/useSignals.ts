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

    const fetchSignals = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/signals');

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.events?.length > 0) {
                // Merge real events with mock events for a fuller dashboard
                const realEvents: EventItem[] = data.events.map((e: any) => ({
                    ...e,
                    baseTitle: e.title || 'Unknown Signal',
                    titleOverride: e.title || 'Unknown Signal',
                    category: e.category.toUpperCase(),
                    // Ensure all required fields are present
                    lat: e.lat || (Math.random() * 140 - 70),
                    lng: e.lng || (Math.random() * 360 - 180),
                }));

                // Keep some mock events for visual density, but prioritize real ones
                const mockSubset = EVENTS.slice(0, Math.max(0, 10 - realEvents.length));
                setEvents([...realEvents, ...mockSubset]);
                setError(null);
            } else if (useMockFallback) {
                // Fall back to mock data if API returns empty
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
