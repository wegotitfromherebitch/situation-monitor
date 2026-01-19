"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Minus, RefreshCw, Plane, Ship } from 'lucide-react';
import { EventItem } from '../lib/events';
import { generateMilitaryAssets, moveAssets, MilitaryAsset } from '../lib/military';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
    loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-zinc-600 font-mono text-xs">INITIALIZING SATELLITE UPLINK...</div>,
    ssr: false
});

interface MapViewProps {
    events: EventItem[];
    onEventClick?: (event: EventItem) => void;
    className?: string; // Allow className prop for sizing
}

export function MapView({ events, onEventClick, className }: MapViewProps) {
    const [militaryAssets, setMilitaryAssets] = useState<MilitaryAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [quakes, setQuakes] = useState<any[]>([]);

    // Initialize military assets
    useEffect(() => {
        setMilitaryAssets(generateMilitaryAssets(12));
    }, []);

    // Military asset movement loop
    useEffect(() => {
        const interval = setInterval(() => {
            setMilitaryAssets(prev => moveAssets(prev));
        }, 2000); // 2s update
        return () => clearInterval(interval);
    }, []);

    // Fetch Quakes
    useEffect(() => {
        const fetchQuakes = () => {
            fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
                .then(res => res.json())
                .then(data => {
                    setQuakes(data.features?.slice(0, 20) || []);
                })
                .catch(err => console.error("Seismic uplink failed", err));
        }
        fetchQuakes();
    }, []);

    // LIVE DATA UPLINK: Fetch real ADS-B data
    useEffect(() => {
        const fetchLiveAirTraffic = async () => {
            try {
                const res = await fetch('/api/military/adsb');
                const data = await res.json();

                if (data.success && data.flights.length > 0) {
                    setMilitaryAssets(prev => {
                        const naval = prev.filter(a => a.type === 'NAVAL');

                        const liveAir = data.flights.map((f: any) => ({
                            id: `adsb-${f.id}`,
                            callsign: f.callsign || 'UAV-X',
                            type: 'AIRCRAFT',
                            subtype: 'RECON',
                            country: f.country === 'United States' ? 'USA' : 'NATO',
                            coordinates: [f.coordinates[0], f.coordinates[1]] as [number, number],
                            heading: f.heading,
                            speed: f.speed,
                            altitude: f.altitude,
                            status: 'PATROL',
                            description: `LIVE FEED: ${f.country} // ${f.callsign}`
                        }));
                        return [...naval, ...liveAir.slice(0, 15)];
                    });
                }
            } catch (e) {
                console.error("Live uplink failed, reverting to simulation", e);
            }
        };

        fetchLiveAirTraffic();
        const poll = setInterval(fetchLiveAirTraffic, 10000);
        return () => clearInterval(poll);
    }, []);

    return (
        <div
            className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 group ${className || 'w-full h-full'}`}
        >

            {/* CSS Grid Overlay - Performance friendly "Intel" look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-10" />

            {/* Legend / Status Layer */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                <div className="flex flex-col gap-2">
                    {militaryAssets.slice(0, 3).map(asset => (
                        <div key={asset.id} className="bg-zinc-950/80 border border-blue-500/30 p-2 rounded flex items-center gap-3 backdrop-blur-sm animate-in slide-in-from-left fade-in duration-500">
                            {asset.type === 'AIRCRAFT' ? <Plane className="w-3 h-3 text-cyan-400" /> : <Ship className="w-3 h-3 text-blue-500" />}
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-cyan-500 font-mono tracking-wider">{asset.callsign}</span>
                                <span className="text-[8px] text-zinc-400 font-mono">{asset.status} // {asset.coordinates[0].toFixed(2)}, {asset.coordinates[1].toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    <div className="bg-zinc-950/80 border border-zinc-800 p-2 rounded text-[9px] text-zinc-500 font-mono">
                        + {militaryAssets.length - 3} ASSETS TRACKING
                    </div>
                </div>
            </div>

            {/* Bottom Right Data Timestamp */}
            <div className="absolute bottom-4 right-4 z-20 font-mono text-[10px] text-zinc-600 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-900">
                LIVE DATA • {new Date().toISOString().split('T')[0]}
            </div>

            {/* The Actual Map */}
            <div className="w-full h-full relative z-0">
                <LeafletMap
                    events={events}
                    militaryAssets={militaryAssets}
                    quakes={quakes}
                    onEventClick={onEventClick}
                    selectedAssetId={selectedAssetId}
                    setSelectedAssetId={setSelectedAssetId}
                />
            </div>
        </div>
    );
}
