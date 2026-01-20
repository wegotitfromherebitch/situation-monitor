import { NextResponse } from 'next/server';

// OpenSky public anonymous API
const OPENSKY_URL = 'https://opensky-network.org/api/states/all';

// Bounding box for Key Strategic Zones
// Latitude: Min/Max, Longitude: Min/Max
const ADSB_REGIONS = [
    { name: 'Black Sea', latMin: 40.0, latMax: 47.0, lonMin: 27.0, lonMax: 42.0 },
    { name: 'Baltics', latMin: 53.0, latMax: 60.0, lonMin: 18.0, lonMax: 30.0 },
    { name: 'Taiwan Strait', latMin: 21.0, latMax: 27.0, lonMin: 117.0, lonMax: 123.0 },
    { name: 'US East Coast', latMin: 34.0, latMax: 40.0, lonMin: -80.0, lonMax: -70.0 }, // Norfolk/DC
    { name: 'US West Coast', latMin: 30.0, latMax: 50.0, lonMin: -130.0, lonMax: -115.0 }, // SD to Seattle
    { name: 'US Southwest', latMin: 31.0, latMax: 37.0, lonMin: -118.0, lonMax: -105.0 }, // Nellis/Miramar
    { name: 'US South', latMin: 24.0, latMax: 31.0, lonMin: -90.0, lonMax: -80.0 }, // Florida/Eglin
    { name: 'Hawaii', latMin: 18.0, latMax: 23.0, lonMin: -160.0, lonMax: -154.0 }, // Hickam
    { name: 'Caribbean', latMin: 10.0, latMax: 25.0, lonMin: -85.0, lonMax: -60.0 },
    { name: 'Red Sea', latMin: 10.0, latMax: 30.0, lonMin: 35.0, lonMax: 45.0 },
];

export async function GET() {
    try {
        // Fetch ALL regions in parallel to maximize "US Accuracy"
        const requests = ADSB_REGIONS.map(region =>
            fetch(`${OPENSKY_URL}?lamin=${region.latMin}&lomin=${region.lonMin}&lamax=${region.latMax}&lomax=${region.lonMax}`,
                { next: { revalidate: 30 } })
                .then(res => res.ok ? res.json() : null)
                .catch(err => null)
        );

        const results = await Promise.all(requests);

        // Flatten and deduplicate by ICAO (index 0)
        const allStates = results
            .filter(r => r && r.states)
            .flatMap(r => r.states);

        // Deduplicate
        const uniqueStates = Array.from(new Map(allStates.map((s: any[]) => [s[0], s])).values());

        // Mock "data" structure for downstream compatibility
        const data = { states: uniqueStates };

        // OpenSky returns: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
        // Indices: 0: icao, 1: callsign, 2: country, 5: lon, 6: lat, 7: alt, 9: velocity, 10: heading

        // Explicitly Civilian Airlines to exclude (Major & Low Cost)
        const CIVILIAN_PREFIXES = [
            'AAL', 'DAL', 'UAL', 'SWA', 'JBU', 'FDX', 'UPS', 'NKS', 'FFT', 'SKW', 'ENY', 'RPA', 'ASH', 'ASA',
            'RYR', 'EZY', 'WZZ', 'DLH', 'AFR', 'BAW', 'KLM', 'UAE', 'QTR', 'ANA', 'JAL', 'CPA', 'SIA', 'VIR',
            'VOI', 'VIV', 'AMX', 'CMP'
        ];

        // Critical Military/Gov Charters (Allow these even if N-registered or commercial looking)
        const MIL_CHARTERS = ['CMB', 'RCH', 'CNV', 'GTI', 'CKS', 'OAE', 'BOX', 'GEC', 'ADB', 'N8', 'N9', 'VXX'];
        // VXX (Marine One), N8/N9 (FAA/Gov mostly)

        const flights = (data.states || []).map((state: any[]) => ({
            id: state[0],
            callsign: (state[1] || 'UNK').trim(),
            country: state[2],
            coordinates: [state[6], state[5]] as [number, number], // Lat, Lon
            heading: state[10] || 0,
            speed: Math.round((state[9] || 0) * 1.94384), // m/s to knots
            altitude: Math.round((state[7] || 0) * 3.28084), // meters to feet
            type: 'AIRCRAFT',
            isReal: true // Flag for UI
        })).filter((f: any) => {
            if (f.coordinates[0] === null) return false;

            // 1. Always include known Military/Charter prefixes
            if (MIL_CHARTERS.some(p => f.callsign.startsWith(p))) return true;

            // 2. Exclude common civilians
            if (CIVILIAN_PREFIXES.some(prefix => f.callsign.startsWith(prefix))) return false;

            // 3. Filter generic N-numbers (General Aviation) to reduce clutter, 
            // BUT allow if they look like Gov (handled by MIL_CHARTERS) or we just want less noise.
            // Strict mode:
            if (f.callsign.startsWith('N') && f.callsign.length < 6) {
                // Short N-numbers might be interesting, long ones often cessnas
                return true;
            }
            if (f.callsign.startsWith('N')) return false; // Filter most GA

            return true;
        });

        return NextResponse.json({
            success: true,
            source: 'OPENSKY_NETWORK_LIVE',
            region: 'GLOBAL_SCAN',
            count: flights.length,
            flights
        });

    } catch (error) {
        console.error('ADS-B Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Uplink failed' }, { status: 500 });
    }
}
