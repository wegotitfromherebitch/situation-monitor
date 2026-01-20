import { NextResponse } from 'next/server';
import { generateMilitaryAssets, moveAssets, MilitaryAsset } from '../../lib/military';

// Simple in-memory "store" for simulation persistence (flaky in serverless but works in `next dev`)
let simulatedAssets: MilitaryAsset[] = [];
let lastUpdate = Date.now();

export async function GET() {
    try {
        const now = Date.now();

        // Initialize if empty
        if (simulatedAssets.length === 0) {
            simulatedAssets = generateMilitaryAssets(35); // Generate 35 assets
            lastUpdate = now;
        }

        // Simulate movement based on time delta (simple)
        // In a real serverless env, we'd base this on absolute time or DB
        // For this demo, just move them a bit each request if enough time passed
        if (now - lastUpdate > 1000) {
            // Move 
            simulatedAssets = moveAssets(simulatedAssets);
            lastUpdate = now;
        }

        return NextResponse.json({
            success: true,
            source: 'STRAT_SIM_V4', // Internal identifier
            count: simulatedAssets.length,
            assets: simulatedAssets
        });
    } catch (error) {
        console.error('Military Sim Error:', error);
        return NextResponse.json({ success: false, error: 'Simulation Grid Offline' }, { status: 500 });
    }
}
