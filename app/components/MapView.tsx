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
    focused?: boolean;
}

export function MapView({ events, onEventClick, className, focused }: MapViewProps) {
    const [militaryAssets, setMilitaryAssets] = useState<MilitaryAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [quakes, setQuakes] = useState<any[]>([]);
    const [isAssetListExpanded, setIsAssetListExpanded] = useState(false);

    // ISOLATION LOGIC:
    // 1. If an asset is selected locally, SHOW ONLY THAT ASSET. Hide everything else.
    // 2. If 'focused' is true (Event Selected), SHOW ONLY THAT EVENT. Hide assets/quakes.
    // 3. Otherwise show everything.

    const visibleAssets = useMemo(() => {
        if (selectedAssetId) return militaryAssets.filter(a => a.id === selectedAssetId);
        if (focused) return []; // Hide assets if focusing on an event
        return militaryAssets;
    }, [militaryAssets, selectedAssetId, focused]);

    const visibleQuakes = useMemo(() => {
        if (selectedAssetId || focused) return []; // Hide quakes if focusing on anything
        return quakes;
    }, [quakes, selectedAssetId, focused]);

    const visibleEvents = useMemo(() => {
        if (selectedAssetId) return []; // Hide events if focusing on an asset
        return events;
    }, [events, selectedAssetId]);


    // Initialize military assets (Simulated / Intel Estimate)
    useEffect(() => {
        setMilitaryAssets(generateMilitaryAssets(35)); // Load full set (Carriers + Air Bridges)
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
                        // PRESERVE SIMULATION: Keep all assets that are simulated (isReal === false)
                        // This ensures Air Bridges and Carriers don't disappear when live data loads
                        const simulated = prev.filter(a => a.isReal === false);

                        // STRICT FILTER: ONLY US MILITARY from Live Feed
                        // We map real ADS-B data to our MilitaryAsset format
                        const liveAir = data.flights
                            .filter((f: any) => f.country === 'United States')
                            .map((f: any) => ({
                                id: `adsb-${f.id}`,
                                callsign: f.callsign || 'UAV-X',
                                type: 'AIRCRAFT',
                                subtype: 'RECON',
                                country: 'USA',
                                coordinates: [f.coordinates[0], f.coordinates[1]] as [number, number],
                                heading: f.heading,
                                speed: f.speed,
                                altitude: f.altitude,
                                status: 'PATROL',
                                description: `LIVE FEED: USAF // ${f.callsign}`,
                                isReal: true // Explicitly mark as Live
                            }));

                        // Merge Simulation + Live
                        // Limit live to top 50 to prevent clutter
                        return [...simulated, ...liveAir.slice(0, 50)];
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
            <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex flex-col-reverse items-start gap-2">

                {/* Toggle Button / Summary */}
                <button
                    onClick={() => setIsAssetListExpanded(!isAssetListExpanded)}
                    className="bg-zinc-950/90 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 px-3 py-2 rounded text-[10px] text-zinc-400 font-mono flex items-center gap-2 transition-all shadow-lg backdrop-blur-md group"
                >
                    <span className={isAssetListExpanded ? "rotate-180 transition-transform" : "transition-transform"}>
                        {isAssetListExpanded ? '▼' : '▲'}
                    </span>
                    <span>{militaryAssets.length} US ASSETS TRACKING</span>
                </button>

                {/* The List (Expands Upwards) */}
                <div className={`flex flex-col-reverse gap-2 transition-all duration-300 origin-bottom ${isAssetListExpanded ? 'opacity-100 scale-100 max-h-[400px]' : 'max-h-0 opacity-0 scale-95 pointer-events-none'}`}>
                    {militaryAssets.map(asset => (
                        <div
                            key={asset.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssetId(selectedAssetId === asset.id ? null : asset.id);
                            }}
                            className={`
                                p-2 rounded flex items-center gap-3 backdrop-blur-sm cursor-pointer transition-all border shadow-lg w-[220px]
                                ${selectedAssetId === asset.id
                                    ? 'bg-blue-900/40 border-blue-500/50 text-white translate-x-1'
                                    : 'bg-zinc-950/90 border-blue-500/20 text-zinc-400 hover:bg-zinc-900 hover:border-blue-500/40 hover:text-zinc-200'
                                }
                            `}
                        >
                            {asset.type === 'AIRCRAFT' ? <Plane className="w-3 h-3 text-cyan-400" /> : <Ship className="w-3 h-3 text-blue-500" />}
                            <div className="flex flex-col min-w-0">
                                <span className={`text-[9px] font-bold font-mono tracking-wider truncate flex gap-1 ${!asset.isReal ? 'text-zinc-500' : 'text-cyan-300'}`}>
                                    {asset.callsign}
                                    {!asset.isReal && <span className="text-[7px] bg-zinc-800 px-1 rounded text-zinc-500">SIM</span>}
                                </span>
                                <span className="text-[8px] opacity-70 font-mono truncate">{asset.status} // {asset.coordinates[0].toFixed(2)}, {asset.coordinates[1].toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Right Data Timestamp */}
            <div className="absolute bottom-4 right-4 z-20 font-mono text-[10px] text-zinc-600 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-900">
                LIVE DATA • {new Date().toISOString().split('T')[0]}
            </div>

            {/* The Actual Map */}
            <div className="w-full h-full relative z-0">
                <LeafletMap
                    events={visibleEvents}
                    militaryAssets={visibleAssets}
                    quakes={visibleQuakes}
                    onEventClick={onEventClick}
                    selectedAssetId={selectedAssetId}
                    setSelectedAssetId={setSelectedAssetId}
                />
            </div>
        </div>
    );
}
