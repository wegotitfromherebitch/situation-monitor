"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Graticule, Sphere, Line } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Plus, Minus, RefreshCw } from 'lucide-react';
import { EventItem } from '../lib/events';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapViewProps {
    events: EventItem[];
    onEventClick?: (event: EventItem) => void;
    className?: string; // Allow className prop for sizing
}

const WorldMap = memo(() => (
    <>
        {/* Dark Globe Background */}
        <Sphere stroke="none" strokeWidth={0} fill="#09090b" id="ocean" />

        {/* Subtle Grid Lines */}
        <Graticule stroke="#27272a" strokeWidth={0.5} />

        <Geographies geography={geoUrl}>
            {({ geographies }) =>
                geographies.map((geo) => (
                    <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                            default: {
                                fill: "#18181b", // Dark Zinc
                                stroke: "#3f3f46", // Slight contrast border
                                strokeWidth: 0.5,
                                outline: "none",
                            },
                            hover: {
                                fill: "#27272a",
                                stroke: "#52525b",
                                strokeWidth: 0.7,
                                outline: "none",
                            },
                            pressed: {
                                fill: "#27272a",
                                outline: "none",
                            },
                        }}
                    />
                ))
            }
        </Geographies>
    </>
));

WorldMap.displayName = "WorldMap";

// Removed throttle utility

export function MapView({ events, onEventClick, className }: MapViewProps) {
    const [zoom, setZoom] = useState(1);
    const [center, setCenter] = useState<[number, number]>([0, 20]);
    const [hoveredEvent, setHoveredEvent] = useState<EventItem | null>(null);

    // Color scale for events
    const colorScale = useMemo(() =>
        scaleLinear<string>()
            .domain([0, 50, 100])
            .range(["#10b981", "#f59e0b", "#ef4444"]), // Emerald, Amber, Red (Clean scheme)
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
        <div className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 group ${className || 'w-full h-full'}`}>

            {/* CSS Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <button onClick={handleZoomIn} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                    <Plus className="w-4 h-4" />
                </button>
                <button onClick={handleZoomOut} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                    <Minus className="w-4 h-4" />
                </button>
                <button onClick={handleReset} className="p-2 bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Bottom Right Data Timestamp */}
            <div className="absolute bottom-4 right-4 z-20 font-mono text-[10px] text-zinc-600 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-900">
                LIVE DATA • {new Date().toISOString().split('T')[0]}
            </div>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120,
                }}
                className="w-full h-full relative z-10"
            >
                <ZoomableGroup
                    center={center}
                    zoom={zoom}
                    maxZoom={5}
                    minZoom={0.7}
                    onMove={(evt: any) => {
                        setZoom(evt.zoom);
                        setCenter(evt.coordinates);
                    }}
                >
                    {/* Geographies with hover effect */}
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: {
                                            fill: "#18181b",
                                            stroke: "#3f3f46",
                                            strokeWidth: 0.5,
                                            outline: "none",
                                        },
                                        hover: {
                                            fill: "#27272a",
                                            stroke: "#71717a", // Lighter border on hover
                                            strokeWidth: 1,
                                            outline: "none",
                                            cursor: "crosshair" // Tactical cursor
                                        },
                                        pressed: {
                                            fill: "#27272a",
                                            outline: "none",
                                        },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* ... (keep seismic layer) ... */}

                    {/* Network Connections Layer - Dynamic Illumination */}
                    {useMemo(() => {
                        const lines: any[] = [];
                        const validEvents = events.filter(e => e.coordinates && e.coordinates.length === 2);
                        const categories = Array.from(new Set(validEvents.map(e => e.category)));

                        categories.forEach(cat => {
                            const catEvents = validEvents.filter(e => e.category === cat);
                            for (let i = 0; i < catEvents.length - 1; i++) {
                                lines.push({
                                    from: catEvents[i],
                                    to: catEvents[i + 1],
                                    category: cat
                                });
                            }
                        });
                        return lines;
                    }, [events]).map((line, i) => {
                        // Check if this line is part of the currently hovered category
                        const isActive = hoveredEvent && line.category === hoveredEvent.category;

                        return (
                            <Line
                                key={`conn-${i}`}
                                from={[line.from.coordinates[1], line.from.coordinates[0]]}
                                to={[line.to.coordinates[1], line.to.coordinates[0]]}
                                stroke={
                                    line.category === 'SECURITY' ? '#ef4444' :
                                        line.category === 'CYBER' ? '#06b6d4' :
                                            line.category === 'MARKETS' ? '#10b981' : '#71717a'
                                }
                                strokeWidth={isActive ? (2 / zoom) : (1 / zoom)}
                                strokeOpacity={isActive ? 0.8 : 0.2}
                                strokeLinecap="round"
                                className="pointer-events-none transition-all duration-300"
                            />
                        )
                    })}

                    {/* Main Events (Interactive Markers) */}
                    {markers.map((marker) => {
                        if (!marker.coordinates) return null;
                        const scaleFactor = 1 / zoom;
                        const isHovered = hoveredEvent?.id === marker.id;

                        return (
                            <Marker
                                key={marker.id}
                                coordinates={[marker.coordinates[1], marker.coordinates[0]]}
                                onClick={() => onEventClick?.(marker)}
                                onMouseEnter={() => setHoveredEvent(marker)}
                                onMouseLeave={() => setHoveredEvent(null)}
                                className="cursor-pointer group/marker"
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    {/* Rotating Target Lock Ring (Visible on Hover) */}
                                    {isHovered && (
                                        <g className="animate-[spin_3s_linear_infinite]">
                                            <circle
                                                r={12}
                                                fill="none"
                                                stroke={marker.color}
                                                strokeWidth={1}
                                                strokeDasharray="4 4"
                                                opacity={0.8}
                                            />
                                        </g>
                                    )}

                                    {/* Pulsing effect */}
                                    <circle
                                        r={8}
                                        fill={marker.color}
                                        opacity={0.4}
                                        className={isHovered ? "animate-ping" : "animate-ping"}
                                    />
                                    {/* Core Dot */}
                                    <circle
                                        r={isHovered ? 6 : 4}
                                        fill={marker.color}
                                        stroke="#09090b"
                                        strokeWidth={1.5}
                                        className="transition-all duration-300"
                                    />

                                    {/* Floating Label (Always visible on hover) */}
                                    <g className={`transition-opacity duration-200 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                        <rect
                                            x={14} y={-16}
                                            width={marker.baseTitle.length * 7 + 20}
                                            height={28}
                                            fill="#09090b"
                                            stroke={marker.color}
                                            strokeWidth={1}
                                            rx={4}
                                            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                                        />
                                        <text
                                            textAnchor="start"
                                            x={22} y={2}
                                            className="text-[10px] fill-zinc-100 font-bold tracking-wide"
                                            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
                                        >
                                            {marker.baseTitle.toUpperCase()}
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
