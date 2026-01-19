
type LatLon = { lat: number; lon: number };
type MapPoint = { x: number; y: number };

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

// Simple equirectangular projection into the SVG viewBox.
// Accepts mapW/mapH for flexible coordinate space.
export function projectLonLatToMap({ lon, lat }: LatLon, mapW: number, mapH: number): MapPoint {
    const x01 = clamp01((lon + 180) / 360);
    const y01 = clamp01((90 - lat) / 180);

    return {
        x: x01 * mapW,
        y: y01 * mapH,
    };
}

function hashSeed(s: string) {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    }
    return (h ^ (h >>> 16)) >>> 0;
}

function rand01(seed: number) {
    // Simple PCG or LCG step
    return ((seed * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

// While using demo data, keep pins stable (no random jitter).
// When you switch to real geo-coded events (lat/lon per event), flip this back on.
const PIN_JITTER_ENABLED = false;

const REGION_AREAS: Record<string, { center: LatLon; spread: { lat: number; lon: number } }> = {
    // --- SECURITY HOTSPOTS ---
    "middle east": { center: { lat: 31.5000, lon: 35.0000 }, spread: { lat: 6.5, lon: 10 } }, // Levant + Iraq
    "eastern europe": { center: { lat: 48.0159, lon: 37.8028 }, spread: { lat: 6, lon: 10 } }, // Donbas focus
    "south china sea": { center: { lat: 14.0000, lon: 115.0000 }, spread: { lat: 7, lon: 10 } },
    "korean peninsula": { center: { lat: 36.2000, lon: 127.9000 }, spread: { lat: 2.2, lon: 2.8 } },

    // --- STATE ---
    "south america": { center: { lat: -15.0, lon: -58.0 }, spread: { lat: 10, lon: 14 } }, // Brazil/Andes spread
    "latin america": { center: { lat: -12.0, lon: -60.0 }, spread: { lat: 12, lon: 18 } },
    "africa": { center: { lat: 9.0, lon: 20.0 }, spread: { lat: 14, lon: 18 } }, // Sahel-ish
    "europe": { center: { lat: 48.5, lon: 9.0 }, spread: { lat: 8, lon: 12 } },
    "north america": { center: { lat: 39.0, lon: -98.0 }, spread: { lat: 10, lon: 18 } }, // US-centered

    // --- MARKETS ---
    "asia pacific": { center: { lat: 22.0, lon: 120.0 }, spread: { lat: 8, lon: 10 } }, // Taiwan/PH/JP edge
    "east asia": { center: { lat: 35.0, lon: 103.0 }, spread: { lat: 10, lon: 14 } },
    "global": { center: { lat: 10.0, lon: 0.0 }, spread: { lat: 18, lon: 28 } },
};

export function regionToLatLon(region: string, seedKey: string): LatLon {
    const key = region.toLowerCase().trim();
    const area = REGION_AREAS[key];

    // If we don't recognize the region label, fall back to a small set of sane global centers
    const fallbackCenters: LatLon[] = [
        { lat: 31.5, lon: 35.0 },   // Middle East
        { lat: 49.0, lon: 31.0 },   // Eastern Europe
        { lat: 22.0, lon: 120.0 },  // APAC
        { lat: -15.0, lon: -58.0 }, // South America
        { lat: 9.0, lon: 20.0 },    // Africa
        { lat: 39.0, lon: -98.0 },  // North America
    ];

    const base = area?.center ?? fallbackCenters[hashSeed(key) % fallbackCenters.length];

    // During demo mode, keep pins stable so the map reads “accurate”.
    if (!PIN_JITTER_ENABLED) {
        return {
            lat: clamp(base.lat, -80, 80),
            lon: clamp(base.lon, -179.9, 179.9),
        };
    }

    const spread = area?.spread ?? { lat: 6, lon: 10 };

    // Stable pseudo-random offset inside the region box (prevents stacks on one centroid)
    const h = hashSeed(`${seedKey}|${key}`);
    const r1 = rand01(h + 11);
    const r2 = rand01(h + 29);

    // Centered [-1..1] then scaled
    const dLat = (r1 * 2 - 1) * spread.lat;
    const dLon = (r2 * 2 - 1) * spread.lon;

    return {
        lat: clamp(base.lat + dLat, -80, 80),
        lon: clamp(base.lon + dLon, -179.9, 179.9),
    };
}
