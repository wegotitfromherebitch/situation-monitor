import { EventItem } from './events';

export interface MilitaryAsset {
    id: string;
    callsign: string;
    type: 'AIRCRAFT' | 'NAVAL';
    subtype: 'RECON' | 'FIGHTER' | 'TANKER' | 'CARRIER' | 'DESTROYER' | 'LOGISTICS';
    country: 'USA' | 'NATO' | 'RUS' | 'CHN' | 'UKN';
    coordinates: [number, number]; // Lat, Lon
    heading: number; // 0-360
    speed: number; // knots
    altitude?: number; // ft (aircraft only)
    status: 'PATROL' | 'INTERCEPT' | 'TRANSIT' | 'RTB' | 'DOCKED';
    description: string;
    isReal: boolean; // Distinction for UI
}

// Fleet Definitions for High Accuracy
const CARRIER_GROUPS = [
    {
        name: 'USS DWIGHT D EISENHOWER',
        lat: 36.96, lon: -76.33, // Norfolk Pier 14
        status: 'DOCKED' as const,
        heading: 0,
        speed: 0,
        code: 'CVN-69',
        escorts: 0
    },
    {
        name: 'USS RONALD REAGAN',
        lat: 47.56, lon: -122.64, // Bremerton
        status: 'DOCKED' as const,
        heading: 270,
        speed: 0,
        code: 'CVN-76',
        escorts: 0
    },
    {
        name: 'USS GERALD R FORD',
        lat: 30.50, lon: -45.50, // Mid-Atlantic Crossing
        status: 'PATROL' as const,
        heading: 90,
        speed: 22,
        code: 'CVN-78',
        escorts: 4
    },
    {
        name: 'USS HARRY S TRUMAN',
        lat: 18.20, lon: 39.50, // Red Sea Patrol
        status: 'PATROL' as const,
        heading: 330,
        speed: 18,
        code: 'CVN-75',
        escorts: 4
    },
    {
        name: 'USS GEORGE WASHINGTON',
        lat: 31.10, lon: 133.50, // Philippine Sea
        status: 'PATROL' as const,
        heading: 225,
        speed: 25,
        code: 'CVN-73',
        escorts: 3
    }
];

const DESTROYER_NAMES = ['USS ARLEIGH BURKE', 'USS GRAVELY', 'USS CARNEY', 'USS LABOON', 'USS MASON', 'USS NITZE', 'USS GONZALEZ', 'USS BULKELEY'];

// Strategic Air Bridges (Approximate Great Circle Routes)
// Added randomness in generation to prevent "Line Bunching"
const AIR_BRIDGES = [
    {
        name: 'Pacific Bridge',
        waypoints: [[38.2, -121.9], [22.0, -155.0], [15.0, 150.0], [26.0, 128.0]], // Travis -> ~Hawaii -> ~Guam -> Kadena
        aircraft: ['C-17 GLOBEMASTER III', 'C-5M SUPER GALAXY', 'KC-46A PEGASUS'],
        count: 12
    },
    {
        name: 'Atlantic Bridge',
        waypoints: [[39.0, -75.0], [45.0, -40.0], [50.0, -10.0], [49.5, 7.5], [37.0, 35.0]], // Dover -> N.Atl -> UK -> Ramstein -> Incirlik
        aircraft: ['C-17 GLOBEMASTER III', 'C-130J HERCULES', 'C-5M SUPER GALAXY'],
        count: 10
    },
    {
        name: 'Europe Sentinel',
        waypoints: [[53.0, 1.0], [52.0, 18.0], [46.0, 25.0]], // UK -> Poland -> Romania
        aircraft: ['RC-135V RIVET JOINT', 'E-3G SENTRY', 'P-8A POSEIDON'],
        count: 4
    }
];

function interpolate(p1: number[], p2: number[], t: number): [number, number] {
    return [
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t
    ];
}

export function generateMilitaryAssets(count: number = 25): MilitaryAsset[] {
    const assets: MilitaryAsset[] = [];

    // 1. Generate Carrier Groups (High Value Assets)
    CARRIER_GROUPS.forEach((csg, i) => {
        // The Carrier
        assets.push({
            id: `csg-${csg.code}`,
            callsign: csg.name,
            type: 'NAVAL',
            subtype: 'CARRIER',
            country: 'USA',
            coordinates: [csg.lat, csg.lon],
            heading: csg.heading,
            speed: csg.speed,
            status: csg.status,
            description: `${csg.code} Carrier Strike Group`,
            isReal: false // Intel Estimate
        });

        // The Escorts (Destroyers)
        for (let j = 0; j < csg.escorts; j++) {
            // Dispersion: ~0.2 degrees (12nm) around carrier
            const angle = (360 / csg.escorts) * j + (Math.random() * 20);
            const rad = angle * (Math.PI / 180);
            const dist = 0.15 + Math.random() * 0.1;

            const escLat = csg.lat + Math.cos(rad) * dist;
            const escLon = csg.lon + Math.sin(rad) * dist;

            assets.push({
                id: `esc-${csg.code}-${j}`,
                callsign: DESTROYER_NAMES[(i * 3 + j) % DESTROYER_NAMES.length],
                type: 'NAVAL',
                subtype: 'DESTROYER',
                country: 'USA',
                coordinates: [escLat, escLon],
                heading: csg.heading, // Match fleet heading
                speed: csg.speed,
                status: csg.status,
                description: `Escort for ${csg.code}`,
                isReal: false
            });
        }
    });

    // 2. Global Air Mobility (The backbone of US Power)
    AIR_BRIDGES.forEach((route, rIdx) => {
        for (let i = 0; i < route.count; i++) {
            // Pick a random segment
            const segIdx = Math.floor(Math.random() * (route.waypoints.length - 1));
            const p1 = route.waypoints[segIdx];
            const p2 = route.waypoints[segIdx + 1];
            const t = Math.random(); // Position along segment

            // Base Position
            const [baseLat, baseLon] = interpolate(p1, p2, t);

            // Add Lateral Offset (Corridor Width approx +/- 2 degrees ~ 120nm)
            // This prevents the "Ants in a line" look
            const latOffset = (Math.random() - 0.5) * 3.0;
            const lonOffset = (Math.random() - 0.5) * 3.0;

            // Calculate heading
            const dLon = p2[1] - p1[1];
            const dLat = p2[0] - p1[0];
            const heading = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;

            assets.push({
                id: `air-${rIdx}-${i}`,
                callsign: `RCH${Math.floor(Math.random() * 800) + 100}`, // RCH = Reach (Air Mobility Command)
                type: 'AIRCRAFT',
                subtype: 'LOGISTICS',
                country: 'USA',
                coordinates: [baseLat + latOffset * 0.1, baseLon + lonOffset * 0.1], // Slight deviation
                heading: heading + (Math.random() * 10 - 5), // Slight crab/deviation
                speed: 420 + Math.random() * 60,
                altitude: 30000 + Math.random() * 8000,
                status: 'TRANSIT',
                description: route.aircraft[i % route.aircraft.length],
                isReal: false
            });
        }
    });

    // 3. Strategic Recon Assets (Global Hawk / P8 Poseidon)
    // Black Sea Loiter
    assets.push({
        id: 'asset-forte11',
        callsign: 'FORTE11',
        type: 'AIRCRAFT',
        subtype: 'RECON',
        country: 'USA',
        coordinates: [43.50, 33.50],
        heading: 90,
        speed: 320,
        altitude: 53000,
        status: 'PATROL',
        description: 'RQ-4 Global Hawk',
        isReal: false
    });

    // South China Sea P8
    assets.push({
        id: 'asset-p8-scs',
        callsign: 'TIGER22',
        type: 'AIRCRAFT',
        subtype: 'RECON',
        country: 'USA',
        coordinates: [18.50, 115.50],
        heading: 225,
        speed: 450,
        altitude: 28000,
        status: 'PATROL',
        description: 'P-8A Poseidon',
        isReal: false
    });

    return assets;
}

// Function to simulate movement
export function moveAssets(assets: MilitaryAsset[]): MilitaryAsset[] {
    return assets.map(asset => {
        // DOCKED ships do not move
        if (asset.speed === 0 || asset.status === 'DOCKED') return asset;

        const speedFactor = asset.type === 'AIRCRAFT' ? 0.05 : 0.005; // Aircraft move faster
        const rads = (asset.heading * Math.PI) / 180;

        let newLat = asset.coordinates[0] + (Math.cos(rads) * speedFactor * 0.1);
        let newLon = asset.coordinates[1] + (Math.sin(rads) * speedFactor * 0.1);

        // Turn logic (loitering)
        let newHeading = asset.heading;
        if (asset.subtype === 'RECON' || asset.status === 'PATROL') {
            // Loiter behavior
            if (asset.type === 'AIRCRAFT') {
                newHeading = (asset.heading + (Math.random() * 6 - 3)) % 360;
            }
        }

        return {
            ...asset,
            coordinates: [newLat, newLon],
            heading: newHeading
        };
    });
}
