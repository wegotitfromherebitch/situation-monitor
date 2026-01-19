"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule, Sphere, Line } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Plus, Minus, RefreshCw, Plane, Ship, Target, Anchor } from 'lucide-react';
import { EventItem } from '../lib/events';
import { generateMilitaryAssets, moveAssets, MilitaryAsset } from '../lib/military';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapViewProps {
    events: EventItem[];
    onEventClick?: (event: EventItem) => void;
    className?: string; // Allow className prop for sizing
}

// Isolated Map Component to prevent re-renders from fighting user interaction
const MapContent = memo(({ events = [], militaryAssets = [], onEventClick, selectedAssetId, setSelectedAssetId }: any) => {
    const [zoom, setZoom] = useState(1);
    const [center, setCenter] = useState<[number, number]>([0, 20]);
    const [quakes, setQuakes] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real seismic data (4.5+ magnitude, last 24h)
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

    // Color scale
    const colorScale = useMemo(() =>
        scaleLinear<string>().domain([0, 50, 100]).range(["#10b981", "#f59e0b", "#ef4444"]),
        []);

    const markers = useMemo(() => {
        return (events || []).map((evt: any) => ({
            ...evt,
            color: colorScale(evt.severity)
        }));
    }, [events, colorScale]);

    const handleZoomIn = () => setZoom(z => Math.min(z * 2, 50));
    const handleZoomOut = () => setZoom(z => Math.max(z / 2, 0.5));
    const handleReset = () => { setZoom(1); setCenter([0, 20]); };

    return (
        <>
            {/* Top Right Controls - Inside MapContent to access local state */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
                <button onClick={handleZoomIn} className="p-2.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all active:scale-95 shadow-lg">
                    <Plus className="w-5 h-5" />
                </button>
                <div className="text-center text-[10px] font-mono text-zinc-500 py-1">{Math.round(zoom * 100)}%</div>
                <button onClick={handleZoomOut} className="p-2.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all active:scale-95 shadow-lg">
                    <Minus className="w-5 h-5" />
                </button>
                <div className="mt-2" />
                <button onClick={handleReset} className="p-2.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all active:scale-95 shadow-lg">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 150 }}
                className="w-full h-full"
                style={{ width: "100%", height: "100%", cursor: 'grab' }}
            >
                <ZoomableGroup
                    center={center}
                    zoom={zoom}
                    maxZoom={50}
                    minZoom={0.5}
                    onMove={(evt: any) => {
                        // Safety check to prevent NaN/Undefined state crashes
                        if (evt.zoom && !isNaN(evt.zoom) && isFinite(evt.zoom)) {
                            setZoom(evt.zoom);
                        }
                        if (evt.coordinates && evt.coordinates.length === 2 && !isNaN(evt.coordinates[0]) && !isNaN(evt.coordinates[1])) {
                            setCenter(evt.coordinates);
                        }
                    }}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: { fill: "#18181b", stroke: "#3f3f46", strokeWidth: 0.5, outline: "none" },
                                        hover: { fill: "#27272a", stroke: "#52525b", strokeWidth: 0.7, outline: "none" },
                                        pressed: { fill: "#27272a", outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Dark Globe Background */}
                    <Sphere stroke="none" strokeWidth={0} fill="#09090b" id="ocean" style={{ pointerEvents: 'none' }} />
                    <Graticule stroke="#27272a" strokeWidth={0.5} style={{ pointerEvents: 'none' }} />

                    {/* Seismic Layer */}
                    {(quakes || []).map((quake) => (
                        <Marker key={quake.id} coordinates={quake.geometry.coordinates}>
                            <g transform={`scale(${1 / zoom})`}>
                                <circle r={quake.properties.mag * 3} fill="transparent" stroke="#facc15" strokeWidth={0.5} opacity={0.3} className="animate-ping" style={{ animationDuration: '3s' }} />
                                <circle r={1.5} fill="#facc15" opacity={0.6} />
                            </g>
                        </Marker>
                    ))}

                    {/* Connections */}
                    {useMemo(() => {
                        const lines: any[] = [];
                        const validEvents = (events || []).filter((e: any) => e.coordinates && e.coordinates.length === 2);
                        const categories = Array.from(new Set(validEvents.map((e: any) => e.category)));
                        categories.forEach(cat => {
                            const catEvents = validEvents.filter((e: any) => e.category === cat);
                            for (let i = 0; i < catEvents.length - 1; i++) {
                                lines.push({ from: catEvents[i], to: catEvents[i + 1], category: cat });
                            }
                        });
                        return lines;
                    }, [events]).map((line, i) => (
                        <Line
                            key={`conn-${i}`}
                            from={[line.from.coordinates[1], line.from.coordinates[0]]}
                            to={[line.to.coordinates[1], line.to.coordinates[0]]}
                            stroke={line.category === 'SECURITY' ? '#ef4444' : line.category === 'CYBER' ? '#06b6d4' : '#71717a'}
                            strokeWidth={1 / zoom}
                            strokeOpacity={0.2}
                            strokeLinecap="round"
                            className="pointer-events-none"
                        />
                    ))}

                    {/* Military Assets */}
                    {(militaryAssets || []).map((asset: any) => {
                        const scaleFactor = 1 / zoom;
                        const isSelected = selectedAssetId === asset.id;
                        return (
                            <Marker
                                key={asset.id}
                                coordinates={[asset.coordinates[1], asset.coordinates[0]]}
                                onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                                className="cursor-pointer group/asset"
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    <g transform={`rotate(${asset.heading}) scale(0.8)`}>
                                        {asset.type === 'AIRCRAFT' ? (
                                            <path d="M0,-11 L2,-3 L9,3 L2,4 L2,9 L5,11 L0,10 L-5,11 L-2,9 L-2,4 L-9,3 L-2,-3 Z" fill={isSelected ? "#22d3ee" : "#0ea5e9"} stroke="#09090b" strokeWidth={1} />
                                        ) : (
                                            <g>
                                                <path d="M0,-10 C 4,-5 4,6 0,10 C -4,6 -4,-5 0,-10" fill={isSelected ? "#60a5fa" : "#3b82f6"} stroke="#09090b" strokeWidth={1} />
                                                <rect x="-2" y="-2" width="4" height="6" fill="#1e3a8a" opacity="0.5" />
                                            </g>
                                        )}
                                    </g>
                                    {isSelected && (
                                        <circle r={40} fill="none" stroke={asset.type === 'AIRCRAFT' ? "#22d3ee" : "#3b82f6"} strokeWidth={0.5} strokeDasharray="4 2" opacity={0.5} className="animate-spin-slow" />
                                    )}
                                    <g className={`transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/asset:opacity-100'}`}>
                                        <rect x={10} y={-10} width={80} height={30} fill="#09090b" stroke="#3b82f6" strokeWidth={0.5} rx={2} />
                                        <text x={14} y={2} className="text-[8px] fill-cyan-400 font-mono font-bold">{asset.callsign}</text>
                                        <text x={14} y={12} className="text-[6px] fill-zinc-400 font-mono">{asset.subtype} • {Math.round(asset.speed)}kts</text>
                                    </g>
                                </g>
                            </Marker>
                        );
                    })}

                    {/* Events */}
                    {markers.map((marker: any) => {
                        if (!marker.coordinates) return null;
                        const scaleFactor = 1 / zoom;
                        const isSecurity = marker.category === 'SECURITY';
                        const isCyber = marker.category === 'CYBER';
                        return (
                            <Marker
                                key={marker.id}
                                coordinates={[marker.coordinates[1], marker.coordinates[0]]}
                                onClick={() => onEventClick?.(marker)}
                                className="cursor-pointer group/marker"
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    <circle r={isSecurity ? 12 : 8} fill={marker.color} opacity={0.2} className="animate-ping" />
                                    {isSecurity ? (
                                        <rect x={-4} y={-4} width={8} height={8} transform="rotate(45)" fill={marker.color} stroke="#09090b" strokeWidth={1} />
                                    ) : isCyber ? (
                                        <rect x={-3.5} y={-3.5} width={7} height={7} fill={marker.color} stroke="#09090b" strokeWidth={1} />
                                    ) : (
                                        <circle r={4} fill={marker.color} stroke="#09090b" strokeWidth={1.5} />
                                    )}
                                    {isSecurity && (
                                        <g className="animate-[spin_4s_linear_infinite]">
                                            <circle r={14} fill="none" stroke={marker.color} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.5} />
                                        </g>
                                    )}
                                    <g className="opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <rect x={12} y={-14} width={marker.baseTitle.length * 7 + 16} height={24} fill="#09090b" stroke={marker.color} strokeWidth={1} rx={4} />
                                        <text textAnchor="start" x={20} y={2} className="text-[10px] fill-zinc-200 font-bold" style={{ fontFamily: 'system-ui', fontSize: 10 }}>{marker.baseTitle}</text>
                                    </g>
                                </g>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>
        </>
    );
});
MapContent.displayName = "MapContent";

export function MapView({ events, onEventClick, className }: MapViewProps) {
    const [militaryAssets, setMilitaryAssets] = useState<MilitaryAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    // Initialize military assets
    useEffect(() => {
        setMilitaryAssets(generateMilitaryAssets(12));
    }, []);

    // Military asset movement loop
    useEffect(() => {
        const interval = setInterval(() => {
            setMilitaryAssets(prev => moveAssets(prev));
        }, 2000); // 2s update (Low freq to prevent map interaction conflict)
        return () => clearInterval(interval);
    }, []);

    // LIVE DATA UPLINK: Fetch real ADS-B data
    useEffect(() => {
        const fetchLiveAirTraffic = async () => {
            try {
                const res = await fetch('/api/military/adsb');
                const data = await res.json();

                if (data.success && data.flights.length > 0) {
                    setMilitaryAssets(prev => {
                        // Keep our strategic naval assets (simulated)
                        const naval = prev.filter(a => a.type === 'NAVAL');

                        // Convert OpenSky flights to MilitaryAsset format
                        const liveAir = data.flights.map((f: any) => ({
                            id: `adsb-${f.id}`,
                            callsign: f.callsign || 'UAV-X',
                            type: 'AIRCRAFT',
                            subtype: 'RECON', // Assume recon/patrol for visual style
                            country: f.country === 'United States' ? 'USA' : 'NATO',
                            coordinates: [f.coordinates[0], f.coordinates[1]] as [number, number],
                            heading: f.heading,
                            speed: f.speed,
                            altitude: f.altitude,
                            status: 'PATROL',
                            description: `LIVE FEED: ${f.country} // ${f.callsign}`
                        }));

                        // Merge: Naval + Live Air (take first 15 live contacts to avoid clutter)
                        // If live feed fails, we might want to keep simulated air, 
                        // but sticking to "Real + Sim Naval" is a good hybrid.
                        return [...naval, ...liveAir.slice(0, 15)];
                    });
                }
            } catch (e) {
                console.error("Live uplink failed, reverting to simulation", e);
            }
        };

        // Initial fetch and poll every 10s
        fetchLiveAirTraffic();
        const poll = setInterval(fetchLiveAirTraffic, 10000);
        return () => clearInterval(poll);
    }, []);

    return (
        <div
            className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 group ${className || 'w-full h-full'}`}
            // Capture scroll to allow map zooming
            onWheel={(e) => {
                e.stopPropagation();
            }}
        >

            {/* CSS Grid Overlay - Performance friendly "Intel" look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />

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

            <MapContent
                events={events}
                militaryAssets={militaryAssets}
                onEventClick={onEventClick}
                selectedAssetId={selectedAssetId}
                setSelectedAssetId={setSelectedAssetId}
            />
        </div>
    );
}
