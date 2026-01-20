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
    const size = isSecurity ? 12 : 8; // Smaller, sharper core
    const haloSize = isSecurity ? 24 : 16; // Stable, non-expanding halo

    // Container matches halo size
    const containerSize = 30;

    const html = `
        <div class="relative flex items-center justify-center w-full h-full">
            <!-- Static Glow Halo (No Animation) -->
            <div class="absolute rounded-full opacity-20" 
                 style="width: ${haloSize}px; height: ${haloSize}px; background-color: ${color};"></div>
            
            <!-- Breathing Core Dot -->
            <div class="relative rounded-full border border-black/80 shadow-sm animate-pulse" 
                 style="width: ${size}px; height: ${size}px; background-color: ${color}; box-shadow: 0 0 5px ${color};"></div>
        </div>
    `;

    return L.divIcon({
        className: 'bg-transparent',
        html: html,
        iconSize: [containerSize, containerSize],
        iconAnchor: [containerSize / 2, containerSize / 2]
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

    // Fly to selected asset
    useEffect(() => {
        if (!map || !selectedAssetId) return;

        const asset = militaryAssets.find(a => a.id === selectedAssetId);
        if (asset) {
            map.flyTo([asset.coordinates[0], asset.coordinates[1]], 8, {
                animate: true,
                duration: 1.5
            });
        }
    }, [map, selectedAssetId, militaryAssets]);

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
                const eventTime = new Date(Date.now() - event.updatedMinutesAgo * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                            <div className="bg-zinc-950 border border-zinc-700 p-2 rounded text-zinc-200 font-mono text-xs min-w-[160px]">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <div className={`font-bold ${event.severity > 70 ? 'text-red-400' : 'text-emerald-400'}`}>{event.baseTitle}</div>
                                    <div className="text-[9px] text-zinc-500 font-bold whitespace-nowrap bg-zinc-900 px-1 rounded">{eventTime}</div>
                                </div>
                                <div className="text-[10px] text-zinc-400 leading-tight border-t border-zinc-800 pt-1 mt-1">{event.summary || 'No details available'}</div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Target Overlay for Isolated Event */}
            {events.length === 1 && events[0].coordinates && (
                <Marker
                    position={[events[0].coordinates[0], events[0].coordinates[1]]}
                    icon={L.divIcon({
                        className: 'bg-transparent pointer-events-none',
                        html: `
                            <div class="relative w-[120px] h-[120px] flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
                                <!-- Rotating Outer Ring -->
                                <div class="absolute inset-0 border border-emerald-500/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
                                
                                <!-- Counter-Rotating Inner Ring/Brackets -->
                                <div class="absolute inset-4 border-2 border-dashed border-emerald-500/50 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
                                
                                <!-- Pulse Background -->
                                <div class="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>

                                <!-- Corner Brackets -->
                                <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                                <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                                <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                                <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                                
                                <!-- Label -->
                                <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-emerald-500 font-bold tracking-widest bg-black/50 px-2 py-0.5 rounded whitespace-nowrap">
                                    TARGET LOCKED
                                </div>
                            </div>
                        `,
                        iconSize: [120, 120],
                        iconAnchor: [60, 60]
                    })}
                    interactive={false}
                    zIndexOffset={100}
                />
            )}

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
                        <AssetPopupContent asset={asset} />
                    </Popup>
                </Marker>
            ))}

        </MapContainer>
    );
}

// Extracted Popup Content Component to handle logic cleanly
function AssetPopupContent({ asset }: { asset: MilitaryAsset }) {
    // Helper to resolve image and model
    const details = (() => {
        const desc = (asset.description || '').toUpperCase();
        const call = (asset.callsign || '').toUpperCase();

        // 1. CARRIERS
        if (asset.subtype === 'CARRIER') return {
            model: 'NIMITZ CLASS CARRIER',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/USS_Nimitz_(CVN-68).jpg?width=400'
        };

        // 2. DESTROYERS
        if (asset.subtype === 'DESTROYER') return {
            model: 'ARLEIGH BURKE CLASS',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/USS_Arleigh_Burke_(DDG_51)_steams_through_the_Mediterranean_Sea.jpg?width=400'
        };

        // 3. AIRCRAFT (Simulated or Live Key Words)
        if (desc.includes('GLOBEMASTER') || desc.includes('C-17')) return {
            model: 'C-17 GLOBEMASTER III',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/C-17A_GLOBEMASTER_III.jpg?width=400'
        };
        if (desc.includes('STRATOTANKER') || desc.includes('KC-135')) return {
            model: 'KC-135R STRATOTANKER',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/KC135-CFM56.jpg?width=400'
        };
        if (desc.includes('POSEIDON') || desc.includes('P-8')) return {
            model: 'P-8A POSEIDON',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/P-8_Poseidon_at_CBR.JPG?width=400'
        };
        if (desc.includes('GLOBAL HAWK') || desc.includes('RQ-4') || desc.includes('FORTE')) return {
            model: 'RQ-4 GLOBAL HAWK',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/RQ-4_Global_Hawk.jpg?width=400'
        };
        if (desc.includes('HERCULES') || desc.includes('C-130')) return {
            model: 'C-130 HERCULES',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lockheed_C-130_Hercules.jpg?width=400' // Guessing filename, fallback handled
        };
        if (desc.includes('LIGHTNING') || desc.includes('F-35')) return {
            model: 'F-35 LIGHTNING II',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/F-35_Lightning_II.jpg?width=400'
        };

        // 4. GENERIC FALLBACKS BASED ON SUBTYPE
        if (asset.subtype === 'FIGHTER') return {
            model: 'AIR SUPERIORITY FIGHTER',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/F-22_Raptor_edit1_(cropped).jpg?width=400'
        };
        if (asset.subtype === 'TANKER') return {
            model: 'AERIAL REFUELING',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/KC-10_Extender_Refueling.jpg?width=400'
        };
        if (asset.subtype === 'LOGISTICS') return {
            model: 'STRATEGIC AIRLIFT',
            img: 'https://commons.wikimedia.org/wiki/Special:FilePath/C-5_Galaxy_taking_off_from_Travis_AFB.jpg?width=400'
        };

        // Default
        return {
            model: asset.subtype || 'UNKNOWN ASSET',
            img: null
        };
    })();

    // Image Error Fallback (in case Wiki filename is wrong)
    const [imgError, setImgError] = useState(false);

    return (
        <div className="bg-zinc-950/90 backdrop-blur-md border border-cyan-500/30 p-0 rounded shadow-2xl text-zinc-200 font-mono text-xs w-[240px] overflow-hidden flex flex-col">

            {/* Image Section */}
            {details.img && !imgError && (
                <div className="w-full h-32 relative bg-zinc-900 border-b border-cyan-500/20">
                    <img
                        src={details.img}
                        alt={details.model}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-zinc-950 to-transparent opacity-80" />
                </div>
            )}

            {/* Header Content */}
            <div className={`p-3 border-b border-cyan-500/30 flex flex-col ${!details.img || imgError ? 'bg-cyan-900/20' : 'relative -mt-8 z-10'}`}>
                <span className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase opacity-90 drop-shadow-md">
                    {asset.country} // {details.model}
                </span>
                <span className="text-xl font-bold text-white tracking-wide drop-shadow-md">
                    {asset.callsign}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="p-3 bg-zinc-950/50">
                <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-400">
                    <div>
                        <span className="text-cyan-500/70 block text-[9px] font-bold mb-0.5 tracking-wider">SPEED</span>
                        <span className="text-zinc-100 font-medium text-xs">{Math.round(asset.speed || 0)} KTS</span>
                    </div>
                    <div>
                        <span className="text-cyan-500/70 block text-[9px] font-bold mb-0.5 tracking-wider">ALTITUDE</span>
                        <span className="text-zinc-100 font-medium text-xs">{asset.altitude ? Math.round(asset.altitude).toLocaleString() + ' FT' : 'SURFACE'}</span>
                    </div>
                </div>

                {/* Description Footer */}
                <div className="mt-3 pt-2 border-t border-white/5 text-[9px] text-zinc-500 uppercase tracking-tight leading-relaxed">
                    {asset.description}
                </div>

                {/* Status Indicator */}
                <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${asset.isReal ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                        {asset.isReal ? 'LIVE FEED' : 'SIMULATION'}
                    </span>
                    <span className="text-[8px] text-zinc-600 font-bold">{asset.status} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
}

