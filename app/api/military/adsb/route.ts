import { NextResponse } from 'next/server';

// OpenSky public anonymous API
const OPENSKY_URL = 'https://opensky-network.org/api/states/all';

// Bounding box for Black Sea Region (Active Conflict Zone)
// Lat: 40.0 to 48.0, Lon: 26.0 to 42.0 (Roughly)
const ADSB_REGIONS = [
    { name: 'Black Sea', latMin: 40.0, latMax: 47.0, lonMin: 27.0, lonMax: 42.0 },
    { name: 'Baltics', latMin: 53.0, latMax: 60.0, lonMin: 18.0, lonMax: 30.0 }, // Kaliningrad/Suwalki
    { name: 'Taiwan Strait', latMin: 21.0, latMax: 27.0, lonMin: 117.0, lonMax: 123.0 },
];

export async function GET() {
    try {
        // We will fetch one region randomly to avoid rate limits, or all if we're daring.
        // Public API is limited. Let's just do Black Sea for now as it's the most active "simulation" zone.
        const region = ADSB_REGIONS[0];

        const url = `${OPENSKY_URL}?lamin=${region.latMin}&lomin=${region.lonMin}&lamax=${region.latMax}&lomax=${region.lonMax}`;

        const response = await fetch(url, { next: { revalidate: 30 } }); // Cache for 30s
        if (!response.ok) {
            throw new Error(`OpenSky API Error: ${response.status}`);
        }

        const data = await response.json();

        // OpenSky returns: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
        // Indices: 0: icao, 1: callsign, 2: country, 5: lon, 6: lat, 7: alt, 9: velocity, 10: heading

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
        })).filter((f: any) => f.coordinates[0] !== null && !f.callsign.startsWith('RYR') && !f.callsign.startsWith('WZZ'));
        // Simple filter to remove obvious cheap airlines (Ryanair, Wizz) to make it look "more military" if desired, 
        // or kep them to show "Civilian Traffic". For "Military" feed, filtering out obvious holiday jets helps the vibe.

        return NextResponse.json({
            success: true,
            source: 'OPENSKY_NETWORK_LIVE',
            region: region.name,
            count: flights.length,
            flights
        });

    } catch (error) {
        console.error('ADS-B Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Uplink failed' }, { status: 500 });
    }
}
