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
    status: 'PATROL' | 'INTERCEPT' | 'TRANSIT' | 'RTB';
    description: string;
}

// Known military callsigns for realism
const CALLSIGNS = {
    RECON: ['FORTE10', 'FORTE11', 'JAKE11', 'LAGOON', 'HOMER', 'PYTHON'],
    FIGHTER: ['VIPER', 'SLAYER', 'EAGLE', 'RAVEN', 'DICE'],
    TANKER: ['GOLD', 'LAGER', 'NCHO', 'HOBO'],
    CARRIER: ['USS GERALD R FORD', 'USS DWIGHT D EISENHOWER', 'USS RONALD REAGAN'],
    DESTROYER: ['USS ARLEIGH BURKE', 'USS GRAVELY', 'USS CARNEY']
};

// Strategic locations for logic
const HOTSPOTS = [
    { name: 'Black Sea', lat: 44.5000, lon: 34.1000, type: 'CONFLICT' }, // Near Crimea
    { name: 'Taiwan Strait', lat: 24.4700, lon: 119.8500, type: 'TENSION' },
    { name: 'Red Sea', lat: 14.5000, lon: 42.2000, type: 'CONFLICT' },
    { name: 'Baltics', lat: 56.5000, lon: 19.5000, type: 'DETERRENCE' },
    { name: 'South China Sea', lat: 11.2000, lon: 114.3000, type: 'TENSION' }
];

export function generateMilitaryAssets(count: number = 8): MilitaryAsset[] {
    const assets: MilitaryAsset[] = [];

    // Always ensure a Global Hawk is "loitering" in the Black Sea or Baltics (High realism)
    assets.push({
        id: 'asset-forte11',
        callsign: 'FORTE11',
        type: 'AIRCRAFT',
        subtype: 'RECON',
        country: 'USA',
        coordinates: [44.1500, 33.5000], // Central Black Sea Patrol
        heading: 90,
        speed: 320,
        altitude: 53000,
        status: 'PATROL',
        description: 'RQ-4 Global Hawk - High Altitude Reconnaissance'
    });

    // Carrier Group in Red Sea / Med
    assets.push({
        id: 'asset-ike',
        callsign: 'USS DWIGHT D EISENHOWER',
        type: 'NAVAL',
        subtype: 'CARRIER',
        country: 'USA',
        coordinates: [33.8500, 31.2500], // Eastern Med hotspot (Offshore Egypt/Gaza)
        heading: 180,
        speed: 25,
        status: 'PATROL',
        description: 'CVN-69 Carrier Strike Group'
    });

    // Only generate random assets near specific naval chokepoints if NAVAL
    // This prevents "ships on land" errors
    const NAVAL_SPAWN_POINTS = [
        { lat: 34.5000, lon: 26.5000 }, // East Med (Crete/Cyprus Gap)
        { lat: 13.5000, lon: 48.0000 }, // Gulf of Aden
        { lat: 18.5000, lon: 116.5000 }, // South China Sea (Paracels)
        { lat: 56.2500, lon: 18.7500 }, // Central Baltic
        { lat: 34.7500, lon: 138.5000 }, // Sea of Japan (Sagami Bay area)
        { lat: 43.5000, lon: 35.5000 }  // Central Black Sea (Away from Turkey coast)
    ];

    for (let i = 0; i < count; i++) {
        const isAir = Math.random() > 0.4;
        const type = isAir ? 'AIRCRAFT' : 'NAVAL';

        let lat, lon, description_suffix;

        if (type === 'NAVAL') {
            // Pick a safe water point
            const spot = NAVAL_SPAWN_POINTS[Math.floor(Math.random() * NAVAL_SPAWN_POINTS.length)];
            // Very small dispersion (0.5 deg is ~30 miles) to stay in water
            lat = spot.lat + (Math.random() * 1.0 - 0.5);
            lon = spot.lon + (Math.random() * 1.0 - 0.5);
            description_suffix = 'Maritime Patrol';
        } else {
            // Aircraft can fly anywhere near hotspots
            const spot = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
            lat = spot.lat + (Math.random() * 6 - 3);
            lon = spot.lon + (Math.random() * 6 - 3);
            description_suffix = `Sector ${spot.name}`;
        }

        let subtype: MilitaryAsset['subtype'] = 'LOGISTICS';
        if (isAir) {
            subtype = Math.random() > 0.6 ? 'RECON' : (Math.random() > 0.5 ? 'TANKER' : 'FIGHTER');
        } else {
            subtype = Math.random() > 0.8 ? 'CARRIER' : 'DESTROYER';
        }

        const callsignList = CALLSIGNS[subtype as keyof typeof CALLSIGNS] || ['OSCAR'];
        const callsign = `${callsignList[Math.floor(Math.random() * callsignList.length)]}${Math.floor(Math.random() * 99)}`;

        assets.push({
            id: `asset-${Math.random().toString(36).substr(2, 9)}`,
            callsign,
            type,
            subtype,
            country: 'USA',
            coordinates: [lat, lon],
            heading: Math.floor(Math.random() * 360),
            speed: isAir ? 400 + Math.random() * 200 : 15 + Math.random() * 20,
            altitude: isAir ? 25000 + Math.floor(Math.random() * 30000) : undefined,
            status: 'PATROL',
            description: `${isAir ? 'USAF' : 'US NAVY'} ${subtype} - ${description_suffix}`
        });
    }

    return assets;
}

// Function to simulate movement
export function moveAssets(assets: MilitaryAsset[]): MilitaryAsset[] {
    return assets.map(asset => {
        // Simple movement math (rough approx for visual)
        // 1 deg Lat ~= 60nm. At 400kts, move ~6.6 deg per hour? 
        // Let's just do small increments for smooth visual flow per tick

        const speedFactor = asset.type === 'AIRCRAFT' ? 0.05 : 0.005; // Aircraft move faster
        const rads = (asset.heading * Math.PI) / 180;

        let newLat = asset.coordinates[0] + (Math.cos(rads) * speedFactor * 0.1);
        let newLon = asset.coordinates[1] + (Math.sin(rads) * speedFactor * 0.1);

        // Turn logic (loitering)
        let newHeading = asset.heading;
        if (asset.subtype === 'RECON' || asset.status === 'PATROL') {
            // Slowly turn to form circles/patterns
            newHeading = (asset.heading + (Math.random() * 4 - 2)) % 360;
        }

        return {
            ...asset,
            coordinates: [newLat, newLon],
            heading: newHeading
        };
    });
}
