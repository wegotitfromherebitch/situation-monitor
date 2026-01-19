"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { EventItem } from '../lib/events';
import { MilitaryAsset } from '../lib/military';

// Fix for default Leaflet marker icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Custom Controls Component ---
function MapControls() {
    const map = useMap();
    const [zoom, setZoom] = useState(2);

    useEffect(() => {
        if (!map) return;
        const updateZoom = () => setZoom(map.getZoom());
        map.on('zoomend', updateZoom);
        return () => { map.off('zoomend', updateZoom); };
    }, [map]);

    const handleZoomIn = () => map.setZoom(Math.min(map.getZoom() + 1, 18));
    const handleZoomOut = () => map.setZoom(Math.max(map.getZoom() - 1, 2));
    const handleReset = () => {
        map.setView([20, 0], 2);
    };

    return (
        <div
            className="absolute top-4 right-4 z-[2000] flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                }}
                className="p-2.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all active:scale-95 shadow-lg group cursor-pointer"
            >
                <Plus className="w-5 h-5 group-active:scale-110 ease-out duration-75" />
            </button>
            <div className="text-center text-[10px] font-mono text-zinc-500 py-1 select-none bg-black/50 rounded backdrop-blur-sm mx-1">
                {Math.round((zoom / 18) * 100)}%
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                }}
                className="p-2.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all active:scale-95 shadow-lg group cursor-pointer"
            >
                <Minus className="w-5 h-5 group-active:scale-110 ease-out duration-75" />
            </button>
            <div className="mt-2" />
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                }}
                className="p-2.5 bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all active:scale-95 shadow-lg group cursor-pointer"
            >
                <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
            </button>
        </div>
    );
}

// --- Custom Icons via L.divIcon ---

const createEventIcon = (color: string, isSecurity: boolean) => {
    const size = isSecurity ? 18 : 12;
    const ringSize = isSecurity ? 32 : 20;

    // Larger invisible hit container
    const containerSize = 40;

    const html = `
        <div class="relative flex items-center justify-center w-full h-full">
            <div class="absolute rounded-full opacity-30 animate-ping" style="width: ${ringSize}px; height: ${ringSize}px; background-color: ${color}"></div>
            <div class="relative rounded-full border-[1.5px] border-black/80 shadow-sm" style="width: ${size}px; height: ${size}px; background-color: ${color}; box-shadow: 0 0 10px ${color}80;"></div>
        </div>
    `;

    return L.divIcon({
        className: 'bg-transparent',
        html: html,
        iconSize: [containerSize, containerSize],
        iconAnchor: [containerSize / 2, containerSize / 2] // Perfectly centered
    });
};

const createMilitaryIcon = (type: 'AIRCRAFT' | 'NAVAL', heading: number, isSelected: boolean) => {
    const color = type === 'AIRCRAFT' ? '#06b6d4' : '#3b82f6';
    const highlight = isSelected ? 'filter: drop-shadow(0 0 6px #22d3ee);' : '';

    // Generous touch target size (44px is actionable standard)
    const containerSize = 44;
    const iconSize = 24; // Actual visible icon size

    const svg = type === 'AIRCRAFT'
        ? `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="1.5" style="transform: rotate(${heading}deg); overflow: visible;">
             <path d="M12 2 L14 10 L21 16 L14 17 L14 22 L17 24 L12 23 L7 24 L10 22 L10 17 L3 16 L10 10 Z" vector-effect="non-scaling-stroke" />
           </svg>`
        : `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${color}" stroke="#000" stroke-width="1.5" style="transform: rotate(${heading}deg); overflow: visible;">
             <path d="M12 2 L16 8 L16 18 L12 22 L8 18 L8 8 Z" vector-effect="non-scaling-stroke" />
           </svg>`;

    return L.divIcon({
        className: 'bg-transparent transition-all duration-300 flex items-center justify-center',
        html: `<div style="${highlight}">${svg}</div>`,
        iconSize: [containerSize, containerSize],
        iconAnchor: [containerSize / 2, containerSize / 2] // Center of the 44px box
    });
};

interface LeafletMapProps {
    events: EventItem[];
    militaryAssets: MilitaryAsset[];
    quakes: any[];
    onEventClick?: (event: EventItem) => void;
    selectedAssetId: string | null;
    setSelectedAssetId: (id: string | null) => void;
}

export default function LeafletMap({ events, militaryAssets, quakes, onEventClick, selectedAssetId, setSelectedAssetId }: LeafletMapProps) {
    const [map, setMap] = useState<L.Map | null>(null);

    // Calculate connections



    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={true}
            touchZoom={true}
            style={{ width: '100%', height: '100%', background: '#020617' }}
            ref={setMap}
            zoomControl={false} // Disable default zoom controls
            minZoom={2}
        >
            {/* Custom Controls */}
            <MapControls />

            {/* Dark Matter Tile Layer - Premium Tactical Look */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains="abcd"
                maxZoom={20}
            />

            {/* Seismic Activity (Quakes) */}
            {quakes.map(quake => (
                <Marker
                    key={quake.id}
                    position={[quake.geometry.coordinates[1], quake.geometry.coordinates[0]]}
                    icon={L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="w-full h-full rounded-full border border-yellow-500/50 bg-yellow-500/10 animate-ping" style="width: ${Math.max(8, quake.properties.mag * 5)}px; height: ${Math.max(8, quake.properties.mag * 5)}px"></div>`,
                        iconSize: [Math.max(8, quake.properties.mag * 5), Math.max(8, quake.properties.mag * 5)],
                        iconAnchor: [Math.max(8, quake.properties.mag * 5) / 2, Math.max(8, quake.properties.mag * 5) / 2]
                    })}
                >
                    <Popup
                        className="custom-leaflet-popup"
                        closeButton={false}
                        offset={[0, -5]}
                    >
                        <div className="bg-zinc-950 border border-yellow-700/50 p-2 rounded text-zinc-200 font-mono text-xs min-w-[150px]">
                            <div className="font-bold text-yellow-500 flex items-center gap-2">
                                <span className="animate-pulse">⚠</span> M{quake.properties.mag.toFixed(1)} EARTHQUAKE
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1">{quake.properties.place}</div>
                            <div className="text-[9px] text-zinc-500 mt-1 uppercase">
                                DEPTH: {quake.geometry.coordinates[2]}km • {new Date(quake.properties.time).toLocaleTimeString()}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}



            {/* Events */}
            {events.map(event => {
                if (!event.coordinates) return null;
                const isSecurity = event.category === 'SECURITY';
                const color = event.severity > 70 ? '#ef4444' : event.severity > 40 ? '#f59e0b' : '#10b981';

                return (
                    <Marker
                        key={event.id}
                        position={[event.coordinates[0], event.coordinates[1]]}
                        icon={createEventIcon(color, isSecurity)}
                        eventHandlers={{
                            click: () => onEventClick?.(event)
                        }}
                    >
                        <Popup
                            className="custom-leaflet-popup"
                            closeButton={false}
                            offset={[0, -10]}
                        >
                            <div className="bg-zinc-950 border border-zinc-700 p-2 rounded text-zinc-200 font-mono text-xs">
                                <div className="font-bold text-emerald-400">{event.baseTitle}</div>
                                <div className="text-[10px] text-zinc-400">{event.summary || 'No details available'}</div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Military Assets */}
            {militaryAssets.map(asset => (
                <Marker
                    key={asset.id}
                    position={[asset.coordinates[0], asset.coordinates[1]]}
                    icon={createMilitaryIcon(asset.type, asset.heading, selectedAssetId === asset.id)}
                >
                    <Popup
                        className="custom-leaflet-popup"
                        closeButton={false}
                        offset={[0, -12]}
                    >
                        <div className="bg-zinc-950/90 backdrop-blur-md border border-cyan-500/30 p-0 rounded shadow-2xl text-zinc-200 font-mono text-xs min-w-[180px] overflow-hidden">
                            {/* Header with Type Prominent */}
                            <div className="bg-cyan-900/40 p-2 border-b border-cyan-500/30 flex flex-col">
                                <span className="text-[10px] text-cyan-300 font-bold tracking-widest uppercase opacity-70">
                                    {asset.type} // {asset.subtype}
                                </span>
                                <span className="text-lg font-bold text-white tracking-wide">
                                    {asset.callsign}
                                </span>
                            </div>

                            <div className="p-3">
                                <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-400">
                                    <div>
                                        <span className="text-cyan-500/70 block text-[9px] font-bold mb-0.5">SPEED</span>
                                        <span className="text-zinc-100 font-medium">{Math.round(asset.speed || 0)} KTS</span>
                                    </div>
                                    <div>
                                        <span className="text-cyan-500/70 block text-[9px] font-bold mb-0.5">ALTITUDE</span>
                                        <span className="text-zinc-100 font-medium">{asset.altitude ? Math.round(asset.altitude).toLocaleString() + ' FT' : 'SURFACE'}</span>
                                    </div>
                                </div>
                                <div className="mt-3 text-[9px] text-zinc-500 uppercase tracking-tight border-t border-white/5 pt-2">
                                    {asset.description}
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

        </MapContainer>
    );
}
