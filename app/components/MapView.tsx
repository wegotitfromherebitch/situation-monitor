"use client";

import { useMemo, useState, useEffect } from 'react';
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
    const [quakes, setQuakes] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real seismic data from USGS (4.5+ magnitude, last 24h)
        const fetchQuakes = () => {
            fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')
                .then(res => res.json())
                .then(data => {
                    setQuakes(data.features.slice(0, 15)); // Take top 15 to keep map clean
                })
                .catch(err => console.error("Seismic uplink failed", err));
        }

        fetchQuakes();
        const interval = setInterval(fetchQuakes, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

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
                                            fill: "#09090b", // zinc-950 (darker)
                                            stroke: "#27272a", // zinc-800
                                            strokeWidth: 0.5,
                                            outline: "none",
                                        },
                                        hover: {
                                            fill: "#18181b",
                                            stroke: "#3f3f46",
                                            strokeWidth: 0.7,
                                            outline: "none",
                                        },
                                        pressed: {
                                            fill: "#18181b",
                                            outline: "none",
                                        },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Seismic Layer (Real-time USGS Data) */}
                    {quakes.map((quake) => {
                        // Counter-scale factor
                        const scaleFactor = 1 / zoom;
                        const mag = quake.properties.mag;

                        return (
                            <Marker
                                key={quake.id}
                                coordinates={quake.geometry.coordinates}
                            >
                                <g transform={`scale(${scaleFactor})`}>
                                    {/* Static ring */}
                                    <circle
                                        r={mag * 2.5}
                                        fill="transparent"
                                        stroke="#71717a"
                                        strokeWidth={0.5}
                                        opacity={0.4}
                                    />
                                    {/* Ping Effect */}
                                    <circle
                                        r={mag * 4}
                                        fill="transparent"
                                        stroke="#52525b"
                                        strokeWidth={0.3}
                                        opacity={0.2}
                                        className="animate-ping"
                                        style={{ animationDuration: '4s' }}
                                    />
                                    {/* Tiny label on hover */}
                                    <text
                                        y={-8}
                                        textAnchor="middle"
                                        className="text-[6px] fill-zinc-500 opacity-0 group-hover/marker:opacity-100 font-mono"
                                        style={{ fontSize: 6 }}
                                    >
                                        M{mag}
                                    </text>
                                </g>
                            </Marker>
                        )
                    })}

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
        </div>
    );
}
