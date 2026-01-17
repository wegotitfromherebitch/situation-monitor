"use client";

import { useMemo, useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule, Sphere } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Plus, Minus, RefreshCw } from 'lucide-react';
import { EventItem } from '../lib/events';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapViewProps {
    events: EventItem[];
    onEventClick?: (event: EventItem) => void;
    className?: string; // Allow className prop for sizing
}

export function MapView({ events, onEventClick, className }: MapViewProps) {
    const [zoom, setZoom] = useState(1);
    const [center, setCenter] = useState<[number, number]>([0, 20]);
    const [quakes, setQuakes] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real seismic data (4.5+ magnitude, last 24h)
        const fetchQuakes = () => {
            fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
                .then(res => res.json())
                .then(data => {
                    setQuakes(data.features.slice(0, 20));
                })
                .catch(err => console.error("Seismic uplink failed", err));
        }

        fetchQuakes();
        // Poll every minute
        const interval = setInterval(fetchQuakes, 60000);
        return () => clearInterval(interval);
    }, []);

    // Color scale for events
    const colorScale = useMemo(() =>
        scaleLinear<string>()
            .domain([0, 50, 100])
            .range(["#4ade80", "#fbbf24", "#ef4444"]), // Bright Green, Amber, Red
        []);

    const markers = useMemo(() => {
        return events.map(evt => ({
            ...evt,
            color: colorScale(evt.severity)
        }));
    }, [events, colorScale]);

    const handleZoomIn = () => setZoom(z => Math.min(z * 1.5, 5));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.5, 0.7));
    const handleReset = () => { setZoom(1); setCenter([0, 20]); };

    return (
        <div className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-[#020617] group ${className || 'w-full h-full'}`}>

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <button onClick={handleZoomIn} className="p-2 bg-zinc-900/80 border border-zinc-700 text-cyan-400 hover:bg-zinc-800 rounded hover:text-cyan-300 transition-colors">
                    <Plus className="w-4 h-4" />
                </button>
                <button onClick={handleZoomOut} className="p-2 bg-zinc-900/80 border border-zinc-700 text-cyan-400 hover:bg-zinc-800 rounded hover:text-cyan-300 transition-colors">
                    <Minus className="w-4 h-4" />
                </button>
                <button onClick={handleReset} className="p-2 bg-zinc-900/80 border border-zinc-700 text-emerald-500 hover:bg-zinc-800 rounded hover:text-emerald-400 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Bottom Right Data Timestamp */}
            <div className="absolute bottom-4 right-4 z-20 font-mono text-[10px] text-zinc-500 bg-black/50 px-2 py-1 rounded border border-zinc-800/50">
                LIVE ORBITAL DATA • {new Date().toISOString().split('T')[0]}
            </div>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120,
                }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={center}
                    zoom={zoom}
                    maxZoom={5}
                    minZoom={0.7}
                    onMove={({ zoom, coordinates }) => {
                        setZoom(zoom);
                        setCenter(coordinates as [number, number]);
                    }}
                >
                    {/* Globe Background/Ocean */}
                    <Sphere stroke="none" strokeWidth={0} fill="#0f172a" id="ocean" />

                    {/* Grid Lines */}
                    <Graticule stroke="#1e293b" strokeWidth={0.5} />

                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: {
                                            fill: "#1e293b", // Slate-800
                                            stroke: "#334155", // Slate-700 Borders
                                            strokeWidth: 0.75,
                                            outline: "none",
                                        },
                                        hover: {
                                            fill: "#334155",
                                            stroke: "#38bdf8", // Sky-400 Hover Border
                                            strokeWidth: 1,
                                            outline: "none",
                                        },
                                        pressed: {
                                            fill: "#0f172a",
                                            outline: "none",
                                        },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Seismic Layer (Yellow Squares) */}
                    {quakes.map((quake) => {
                        const scaleFactor = 1 / zoom;
                        const mag = quake.properties.mag;

                        return (
                            <Marker
                                key={quake.id}
                                coordinates={quake.geometry.coordinates}
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    <rect
                                        x={-3} y={-3}
                                        width={6} height={6}
                                        fill="#facc15" // Yellow-400
                                        stroke="#a16207" // Yellow-700
                                        strokeWidth={1}
                                        fillOpacity={0.8}
                                    />
                                    <text
                                        y={14}
                                        textAnchor="middle"
                                        className="text-[8px] fill-yellow-500 font-mono font-bold tracking-tight"
                                        style={{ fontSize: 8 }}
                                    >
                                        {mag.toFixed(1)}
                                    </text>
                                </g>
                            </Marker>
                        )
                    })}

                    {/* Main Events (Target Reticles) */}
                    {markers.map((marker) => {
                        if (!marker.coordinates) return null;
                        const scaleFactor = 1 / zoom;

                        return (
                            <Marker
                                key={marker.id}
                                coordinates={[marker.coordinates[1], marker.coordinates[0]]}
                                onClick={() => onEventClick?.(marker)}
                                className="cursor-pointer group/marker"
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    {/* Outer Target Ring (Spinning slowly) */}
                                    <circle
                                        r={12}
                                        fill="transparent"
                                        stroke={marker.color}
                                        strokeWidth={1}
                                        strokeDasharray="4 2"
                                        opacity={0.6}
                                        className="animate-[spin_10s_linear_infinite]"
                                    />

                                    {/* Inner Core */}
                                    <circle
                                        r={4}
                                        fill={marker.color}
                                        stroke="#fff"
                                        strokeWidth={1.5}
                                        className="group-hover/marker:scale-125 transition-transform"
                                    />

                                    {/* Label Box */}
                                    <g className="opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200">
                                        <rect
                                            x={16} y={-12}
                                            width={marker.baseTitle.length * 6 + 16}
                                            height={24}
                                            fill="#020617"
                                            stroke={marker.color}
                                            strokeWidth={1}
                                            rx={2}
                                        />
                                        <text
                                            textAnchor="start"
                                            x={24} y={4}
                                            className="text-[10px] fill-zinc-100 font-mono uppercase tracking-wide"
                                            style={{ fontSize: 10 }}
                                        >
                                            {marker.baseTitle}
                                        </text>
                                    </g>
                                </g>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}
