"use client";

import { useMemo, useState, useEffect, memo } from 'react';
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
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={center}
                    zoom={zoom}
                    maxZoom={5}
                    minZoom={0.7}
                    onMove={(evt: any) => {
                        if (evt.zoom) setZoom(evt.zoom);
                        if (evt.coordinates) setCenter(evt.coordinates);
                    }}
                >
                    <WorldMap />

                    {/* Seismic Layer (Subtle Rings) */}
                    {quakes.map((quake) => {
                        const scaleFactor = 1 / zoom;
                        const mag = quake.properties.mag;

                        return (
                            <Marker
                                key={quake.id}
                                coordinates={quake.geometry.coordinates}
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    <circle
                                        r={mag * 3}
                                        fill="transparent"
                                        stroke="#facc15" // Yellow-400
                                        strokeWidth={0.5}
                                        opacity={0.3}
                                        className="animate-ping"
                                        style={{ animationDuration: '3s' }}
                                    />
                                    <circle
                                        r={1.5}
                                        fill="#facc15"
                                        opacity={0.6}
                                    />
                                </g>
                            </Marker>
                        )
                    })}

                    {/* Main Events (Pulsing Dots) */}
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
                                    {/* Pulsing effect */}
                                    <circle
                                        r={8}
                                        fill={marker.color}
                                        opacity={0.4}
                                        className="animate-ping"
                                    />
                                    {/* Core Dot */}
                                    <circle
                                        r={4}
                                        fill={marker.color}
                                        stroke="#09090b"
                                        strokeWidth={1.5}
                                        className="transition-all duration-300 group-hover/marker:scale-150"
                                    />

                                    {/* Floating Label */}
                                    <g className="opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <rect
                                            x={12} y={-14}
                                            width={marker.baseTitle.length * 7 + 16}
                                            height={24}
                                            fill="#09090b"
                                            stroke={marker.color}
                                            strokeWidth={1}
                                            rx={4}
                                        />
                                        <text
                                            textAnchor="start"
                                            x={20} y={2}
                                            className="text-[10px] fill-zinc-200 font-bold"
                                            style={{ fontFamily: 'system-ui', fontSize: 10 }}
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
