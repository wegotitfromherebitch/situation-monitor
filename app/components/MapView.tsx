"use client";

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { EventItem } from '../lib/events';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapViewProps {
    events: EventItem[];
    onEventClick?: (event: EventItem) => void;
}

export function MapView({ events, onEventClick }: MapViewProps) {
    const [zoom, setZoom] = useState(1);

    // Color scale relative to severity - memoized to prevent recreation
    const colorScale = useMemo(() =>
        scaleLinear<string>()
            .domain([0, 50, 100])
            .range(["#10b981", "#f59e0b", "#ef4444"]),
        []);

    const markers = useMemo(() => {
        return events.map(evt => ({
            ...evt,
            color: colorScale(evt.severity)
        }));
    }, [events, colorScale]);

    return (
        <div className="w-full h-full bg-zinc-950 relative overflow-hidden rounded-xl border border-zinc-900 group">

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120, // slightly larger
                }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={[0, 20]}
                    zoom={1}
                    maxZoom={4}
                    minZoom={0.7}
                    onMove={({ zoom }) => setZoom(zoom)}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: {
                                            fill: "#18181b", // zinc-900
                                            stroke: "#27272a", // zinc-800
                                            strokeWidth: 0.5,
                                            outline: "none",
                                        },
                                        hover: {
                                            fill: "#27272a",
                                            stroke: "#3f3f46",
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

                    {markers.map((marker) => {
                        if (!marker.coordinates) return null;

                        // Counter-scale factor to keep pins constant size visually
                        const scaleFactor = 1 / zoom;

                        return (
                            <Marker
                                key={marker.id}
                                coordinates={[marker.coordinates[1], marker.coordinates[0]]} // lon, lat
                                onClick={() => onEventClick?.(marker)}
                                className="cursor-pointer group/marker"
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    {/* Pulsing effect - fixed size */}
                                    <circle
                                        r={8}
                                        fill={marker.color}
                                        opacity={0.3}
                                        className="animate-ping"
                                    />
                                    <circle
                                        r={4}
                                        fill={marker.color}
                                        stroke="#18181b"
                                        strokeWidth={1}
                                        className="transition-all duration-300 group-hover/marker:scale-150"
                                    />

                                    {/* Floating Label */}
                                    <g className="opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200">
                                        <rect
                                            x={12}
                                            y={-14}
                                            width={marker.baseTitle.length * 7 + 20}
                                            height={24}
                                            rx={4}
                                            fill="#09090b"
                                            stroke={marker.color}
                                            strokeWidth={1}
                                        />
                                        <text
                                            textAnchor="start"
                                            x={20}
                                            y={2}
                                            style={{ fontFamily: 'system-ui', fontSize: 10, fill: '#e4e4e7', fontWeight: 'bold' }}
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

            {/* Scanning Line Overlay - Command Center Aesthetic */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <div
                    className="w-full h-[2px] bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.5)] absolute"
                    style={{
                        animation: 'scan 8s linear infinite'
                    }}
                />
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
