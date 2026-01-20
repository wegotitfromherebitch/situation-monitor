"use client";

import { useMemo, useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Plane, Ship, Activity, Crosshair } from 'lucide-react';
import { EventItem, displayTitleFor } from "../../lib/events";
import { generateMilitaryAssets, moveAssets, MilitaryAsset } from '../../lib/military';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface TacticalMapProps {
    events?: EventItem[];
    onEventClick?: (event: EventItem) => void;
}

export function TacticalMap({ events = [], onEventClick }: TacticalMapProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

    // LAYERS STATE
    const [militaryAssets, setMilitaryAssets] = useState<MilitaryAsset[]>([]);
    const [quakes, setQuakes] = useState<any[]>([]);
    const [isAssetListExpanded, setIsAssetListExpanded] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    // --- LOGIC RESTORATION START ---

    // 1. Initialize Military Assets
    useEffect(() => {
        setMilitaryAssets(generateMilitaryAssets(12));
    }, []);

    // 2. Asset Movement Loop (2s tick)
    useEffect(() => {
        const interval = setInterval(() => {
            setMilitaryAssets(prev => moveAssets(prev));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // 3. Live ADS-B Uplink
    useEffect(() => {
        const fetchLiveAirTraffic = async () => {
            try {
                // Try catch to prevent error spam if API route missing
                const res = await fetch('/api/military/adsb');
                if (!res.ok) return; // Silent fail
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
                // Ignore fetch errors
            }
        };

        fetchLiveAirTraffic();
        const poll = setInterval(fetchLiveAirTraffic, 10000); // 10s poll
        return () => clearInterval(poll);
    }, []);

    // 4. USGS Quake Uplink
    useEffect(() => {
        fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
            .then(res => res.json())
            .then(data => {
                setQuakes(data.features?.slice(0, 20) || []);
            })
            .catch(() => { });
    }, []);

    // --- LOGIC RESTORATION END ---

    function handleZoomIn() {
        if (position.zoom >= 4) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
    }

    function handleZoomOut() {
        if (position.zoom <= 1) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
    }

    // DYNAMIC COLOR SCALE
    const popScale = useMemo(() => scaleLinear<string>()
        .domain([0, 50, 100])
        .range(["#10b981", "#f59e0b", "#f43f5e"]),
        []);

    return (
        <div className="w-full h-full bg-[#050505] relative overflow-hidden rounded-xl border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">

            {/* BACKGROUND GRID */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#1f2937 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 140 }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={(pos) => setPosition(pos)}
                    maxZoom={4}
                    minZoom={1}
                >
                    {/* 1. GEOMETRY */}
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: { fill: "#18181b", stroke: "#27272a", strokeWidth: 0.5, outline: "none" },
                                        hover: { fill: "#27272a", stroke: "#3f3f46", strokeWidth: 0.75, outline: "none" },
                                        pressed: { fill: "#000", outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* 2. MILITARY ASSETS (Restored) */}
                    {militaryAssets.map((asset) => (
                        <Marker
                            key={asset.id}
                            // Convert [lat, lon] -> [lon, lat]
                            coordinates={[asset.coordinates[1], asset.coordinates[0]]}
                            onMouseEnter={() => setHoveredId(asset.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => setSelectedAssetId(selectedAssetId === asset.id ? null : asset.id)}
                        >
                            <g
                                className="group cursor-pointer transition-all duration-1000 ease-linear"
                                style={{
                                    // Use SVG transform for smooth rotation based on heading
                                    transform: `rotate(${asset.type === 'AIRCRAFT' ? asset.heading : 0}deg)`,
                                    transformOrigin: 'center'
                                }}
                            >
                                <circle r={10} className={`fill-transparent stroke-[1px] ${selectedAssetId === asset.id ? 'stroke-cyan-400 animate-ping' : 'stroke-transparent'}`} />

                                {asset.type === 'AIRCRAFT' ? (
                                    // Plane Icon (Simulated Triangle for Cleaner rotation)
                                    <path
                                        d="M0,-6 L5,4 L0,2 L-5,4 Z"
                                        fill={asset.country === 'USA' ? '#22d3ee' : '#38bdf8'} // Cyan for US, Sky for generic
                                        className="drop-shadow-lg"
                                    />
                                ) : (
                                    // Ship Icon (Diamond)
                                    <rect x={-3} y={-3} width={6} height={6} transform="rotate(45)" fill="#3b82f6" className="drop-shadow-lg" />
                                )}
                            </g>

                            {/* Label for Asset (Non-rotating) */}
                            {hoveredId === asset.id && (
                                <g className="pointer-events-none">
                                    <rect x={10} y={-15} width={120} height={35} rx={2} fill="rgba(0,0,0,0.9)" className="stroke-cyan-500/30 stroke-1" />
                                    <text x={16} y={-4} fill="#22d3ee" className="font-mono text-[8px] font-bold">{asset.callsign}</text>
                                    <text x={16} y={8} fill="#94a3b8" className="font-mono text-[6px]">{asset.status} // {asset.coordinates[0].toFixed(2)}</text>
                                </g>
                            )}
                        </Marker>
                    ))}

                    {/* 3. EARTHQUAKES (Restored) */}
                    {quakes.map((quake: any) => (
                        <Marker
                            key={quake.id}
                            coordinates={quake.geometry.coordinates} // GeoJSON is already [lon, lat]
                            onMouseEnter={() => setHoveredId(quake.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <circle r={quake.properties.mag * 1.5} fill="none" stroke="#f97316" strokeWidth={0.5} className="opacity-50" />
                            <circle r={2} fill="#f97316" />
                            {hoveredId === quake.id && (
                                <g className="pointer-events-none">
                                    <rect x={8} y={-10} width={140} height={20} rx={4} fill="rgba(0,0,0,0.8)" className="stroke-orange-500/30 stroke-1" />
                                    <text x={14} y={4} fill="#fdba74" className="font-mono text-[8px]">SEISMIC: M{quake.properties.mag} // {quake.properties.place}</text>
                                </g>
                            )}
                        </Marker>
                    ))}


                    {/* 4. SITUATION EVENTS (Original Layer) */}
                    {events.filter(e => e?.coordinates && Array.isArray(e.coordinates)).map((event) => {
                        const coordinates: [number, number] = [event.coordinates[1], event.coordinates[0]];
                        const name = displayTitleFor(event);
                        const isHovered = hoveredId === event.id;

                        return (
                            <Marker
                                key={event.id}
                                coordinates={coordinates}
                                onMouseEnter={() => setHoveredId(event.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => onEventClick?.(event)}
                            >
                                <g className="group cursor-pointer">
                                    <circle r={8} fill={popScale(event.severity)} className="opacity-0 animate-ping" />
                                    <circle r={3} fill={popScale(event.severity)} className="stroke-black stroke-1 hover:stroke-white transition-all" />
                                    {isHovered && (
                                        <g className="pointer-events-none">
                                            <rect x={12} y={-10} width={name.length * 6 + 24} height={20} rx={4} fill="rgba(0,0,0,0.8)" className="stroke-white/20 stroke-1" />
                                            <text textAnchor="start" x={16} y={4} style={{ fontFamily: "monospace", fontSize: "10px", fill: "white" }}>
                                                {name}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            </Marker>
                        );
                    })}

                </ZoomableGroup>
            </ComposableMap>


            {/* UI LAYER: ASSET LIST (Restored Bottom-Left Overlay) */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex flex-col-reverse items-start gap-2">
                {/* Toggle Button */}
                <button
                    onClick={() => setIsAssetListExpanded(!isAssetListExpanded)}
                    className="bg-zinc-950/90 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 px-3 py-2 rounded text-[10px] text-zinc-400 font-mono flex items-center gap-2 transition-all shadow-lg backdrop-blur-md group"
                >
                    <span className={isAssetListExpanded ? "rotate-180 transition-transform" : "transition-transform"}>
                        {isAssetListExpanded ? '▼' : '▲'}
                    </span>
                    <span>{militaryAssets.length} ASSETS TRACKING</span>
                </button>

                {/* The List */}
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
                                    ? 'bg-cyan-950/60 border-cyan-400/50 text-white translate-x-1'
                                    : 'bg-zinc-950/90 border-blue-500/20 text-zinc-400 hover:bg-zinc-900 hover:border-blue-500/40 hover:text-zinc-200'
                                }
                            `}
                        >
                            {asset.type === 'AIRCRAFT' ? <Plane className="w-3 h-3 text-cyan-400" /> : <Ship className="w-3 h-3 text-blue-500" />}
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-bold font-mono tracking-wider truncate">{asset.callsign}</span>
                                <span className="text-[8px] opacity-70 font-mono truncate">{asset.status} // {asset.coordinates[0].toFixed(2)}, {asset.coordinates[1].toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* OVERLAY: Map UI Controls (Zoom) */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                <button onClick={handleZoomIn} className="w-8 h-8 bg-black/50 border border-white/10 text-white rounded flex items-center justify-center hover:bg-white/10 transition">+</button>
                <button onClick={handleZoomOut} className="w-8 h-8 bg-black/50 border border-white/10 text-white rounded flex items-center justify-center hover:bg-white/10 transition">-</button>
            </div>

        </div>
    );
}
