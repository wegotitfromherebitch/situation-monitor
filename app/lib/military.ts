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
    { name: 'Black Sea', lat: 44.0, lon: 35.0, type: 'CONFLICT' },
    { name: 'Taiwan Strait', lat: 24.5, lon: 119.5, type: 'TENSION' },
    { name: 'Red Sea', lat: 20.0, lon: 38.0, type: 'CONFLICT' },
    { name: 'Baltics', lat: 56.0, lon: 18.0, type: 'DETERRENCE' },
    { name: 'South China Sea', lat: 10.0, lon: 115.0, type: 'TENSION' }
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
        coordinates: [42.5 + Math.random(), 30.0 + Math.random()], // Black Sea approx
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
        coordinates: [33.5, 34.0], // Eastern Med
        heading: 180,
        speed: 25,
        status: 'PATROL',
        description: 'CVN-69 Carrier Strike Group'
    });

    for (let i = 0; i < count; i++) {
        const spot = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
        const isAir = Math.random() > 0.3;
        const type = isAir ? 'AIRCRAFT' : 'NAVAL';

        let subtype: MilitaryAsset['subtype'] = 'LOGISTICS';
        if (isAir) {
            subtype = Math.random() > 0.6 ? 'RECON' : (Math.random() > 0.5 ? 'TANKER' : 'FIGHTER');
        } else {
            subtype = Math.random() > 0.8 ? 'CARRIER' : 'DESTROYER';
        }

        const callsignList = CALLSIGNS[subtype as keyof typeof CALLSIGNS] || ['OSCAR'];
        const callsign = `${callsignList[Math.floor(Math.random() * callsignList.length)]}${Math.floor(Math.random() * 99)}`;

        // Random offset from strategic point
        const lat = spot.lat + (Math.random() * 8 - 4);
        const lon = spot.lon + (Math.random() * 8 - 4);

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
            description: `${isAir ? 'USAF' : 'US NAVY'} ${subtype} Asset - Sector ${spot.name}`
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
