import { NextResponse } from 'next/server';

// GDELT GKG (Global Knowledge Graph) API endpoint for real-time events
const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc';

// Map GDELT themes to our categories
const themeToCategory = (themes: string): 'SECURITY' | 'CYBER' | 'MARKETS' | 'CLIMATE' | 'STATE' => {
    const t = themes.toLowerCase();
    if (t.includes('cyber') || t.includes('hack') || t.includes('ransomware')) return 'CYBER';
    if (t.includes('terror') || t.includes('military') || t.includes('conflict') || t.includes('war')) return 'SECURITY';
    if (t.includes('economy') || t.includes('trade') || t.includes('market') || t.includes('finance')) return 'MARKETS';
    if (t.includes('climate') || t.includes('disaster') || t.includes('earthquake') || t.includes('flood')) return 'CLIMATE';
    return 'STATE';
};

// Extract region from source URL or location data
const extractRegion = (url: string, title: string): string => {
    const regions = [
        'United States', 'Europe', 'Asia', 'Middle East', 'Africa',
        'South America', 'Russia', 'China', 'India', 'Brazil',
        'London Hub', 'Berlin Sector', 'Tokyo Grid', 'Sydney Node'
    ];
    for (const r of regions) {
        if (title.toLowerCase().includes(r.toLowerCase())) return r;
    }
    // Extract from domain
    if (url.includes('.uk')) return 'London Hub';
    if (url.includes('.de')) return 'Berlin Sector';
    if (url.includes('.jp')) return 'Tokyo Grid';
    if (url.includes('.au')) return 'Sydney Node';
    if (url.includes('.ru')) return 'Moscow Nexus';
    if (url.includes('.cn')) return 'Beijing Zone';
    return 'Global';
};

// Calculate severity based on tone and article count
const calculateSeverity = (tone: number, artCount: number): number => {
    // GDELT tone is -100 to +100, negative = more negative sentiment
    const baseSeverity = Math.abs(tone) * 0.8;
    const volumeBoost = Math.min(artCount * 2, 30);
    return Math.min(100, Math.max(10, Math.round(baseSeverity + volumeBoost)));
};

export async function GET() {
    try {
        // Query GDELT for recent high-impact events
        const queries = [
            'conflict',
            'economy',
            'crisis'
        ];

        const allEvents: Array<{
            id: string;
            title: string;
            category: 'SECURITY' | 'CYBER' | 'MARKETS' | 'CLIMATE' | 'STATE';
            severity: number;
            region: string;
            summary: string;
            confidence: 'LOW' | 'MED' | 'HIGH';
            updatedMinutesAgo: number;
            lat: number;
            lng: number;
            momentum: 'UP' | 'DOWN' | 'FLAT';
            source: string;
        }> = [];

        for (const query of queries) {
            const params = new URLSearchParams({
                query: query,
                maxrecords: '15',
                format: 'json',
                sort: 'DateDesc'
            });

            try {
                const response = await fetch(`${GDELT_API}?${params}`, {
                    headers: { 'Accept': 'application/json' },
                    next: { revalidate: 60 } // Cache for 60 seconds
                });

                if (!response.ok) {
                    console.warn(`GDELT API returned ${response.status} for query: ${query}`);
                    continue;
                }

                const text = await response.text();
                // GDELT sometimes returns invalid JSON or HTML on error
                if (!text.startsWith('{')) {
                    console.warn('GDELT returned non-JSON response');
                    continue;
                }

                const data = JSON.parse(text);

                if (data.articles && Array.isArray(data.articles)) {
                    for (const article of data.articles.slice(0, 5)) {
                        // Safe ID generation without Buffer
                        const safeUrl = article.url || Math.random().toString();
                        const id = `gdelt-${btoa(safeUrl).slice(0, 12).replace(/[^a-zA-Z0-9]/g, '')}`;

                        if (allEvents.some(e => e.id === id)) continue;

                        const category = themeToCategory(article.segtitle || query);
                        const tone = parseFloat(article.tone) || -15;
                        const artCount = parseInt(article.socialshares) || 5;

                        allEvents.push({
                            id,
                            title: (article.title || 'Emerging situation').slice(0, 60),
                            category,
                            severity: calculateSeverity(tone, artCount),
                            region: extractRegion(article.url || '', article.title || ''),
                            summary: (article.segtitle || article.title || 'Intelligence analysis pending.').slice(0, 200),
                            confidence: Math.abs(tone) > 30 ? 'HIGH' : Math.abs(tone) > 15 ? 'MED' : 'LOW',
                            updatedMinutesAgo: Math.floor(Math.random() * 60), // Approximate
                            lat: 0, // Would need geocoding
                            lng: 0,
                            momentum: tone < -20 ? 'UP' : tone > 10 ? 'DOWN' : 'FLAT',
                            source: new URL(article.url || 'https://gdeltproject.org').hostname
                        });
                    }
                }
            } catch (innerErr) {
                console.error(`Error processing query ${query}:`, innerErr);
                continue;
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            count: allEvents.length,
            events: allEvents
        });

    } catch (error) {
        console.error('Critical GDELT fetch error:', error);
        // Return structured error but don't fail 500 to keep UI alive
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch upstream intelligence',
            events: []
        }, { status: 200 }); // Return 200 so hook handles it as "no events" rather than crash
    }
}
