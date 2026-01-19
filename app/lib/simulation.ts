import { EventItem, Category, EVENTS } from './events';

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function sevTier(sev: number): 'CRITICAL' | 'ELEVATED' | 'WATCH' | 'MONITOR' {
  if (sev >= 80) return 'CRITICAL';
  if (sev >= 60) return 'ELEVATED';
  if (sev >= 40) return 'WATCH';
  return 'MONITOR';
}

function momentumForDelta(delta: number): "UP" | "FLAT" | "DOWN" {
  if (delta >= 6) return "UP";
  if (delta <= -6) return "DOWN";
  return "FLAT";
}

function jitterSummary(base: string) {
  const tails = [
    "Signal density shifting.",
    "Cross-source correlation pending.",
    "Verification in progress.",
    "Secondary indicators confirming.",
    "Noise floor elevated; filter tightening.",
  ];
  return `${base} ${tails[Math.floor(Math.random() * tails.length)]}`;
}

import { regionToLatLon } from './map-utils';

export function generateNewEvent(seed: number): EventItem {
  const regions = ["Middle East", "Eastern Europe", "South America", "Asia Pacific", "Global", "Africa", "North America"];
  const cats: Category[] = ["SECURITY", "STATE", "MARKETS", "CYBER", "CLIMATE"];
  const baseTitles = {
    SECURITY: ["Airspace activity", "Maritime posture", "Border friction", "Kinetic chatter"],
    STATE: ["Leadership contest", "Diplomatic rupture", "Sanctions pressure", "Election volatility"],
    MARKETS: ["Rates repricing", "Energy volatility", "FX stress", "Credit widening"],
    CYBER: ["DDoS amplification", "Ransomware lateral movement", "Data exfiltration", "ICS probing"],
    CLIMATE: ["Rapid intensification", "Heat dome persistence", "Glacial outburst", "Crop failure warning"],
  } as const;
  const confidences: Array<EventItem["confidence"]> = ["LOW", "MED", "HIGH"];

  const category = cats[seed % cats.length];
  const region = regions[(seed * 7) % regions.length];
  const baseTitle = baseTitles[category][(seed * 3) % baseTitles[category].length];
  const severity = clamp(42 + (seed % 45), 35, 92);
  const confidence = confidences[(seed * 5) % confidences.length];

  // Generate random coords based on region
  const coordsObj = regionToLatLon(region, `seed-${seed}`);

  return {
    id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    category,
    baseTitle,
    momentum: "UP",
    region,
    coordinates: [coordsObj.lat, coordsObj.lon],
    summary: jitterSummary("Fresh signal detected across monitored channels."),
    severity,
    confidence,
    updatedMinutesAgo: 0,
  };
}

export function simulateSync(prev: EventItem[], tick: number): EventItem[] {
  const aged = prev.map((e) => ({ ...e, updatedMinutesAgo: e.updatedMinutesAgo + 1 }));

  const count = Math.random() < 0.35 ? 2 : 1;
  const idxs: number[] = [];
  while (idxs.length < count && idxs.length < aged.length) {
    const i = Math.floor(Math.random() * aged.length);
    if (!idxs.includes(i)) idxs.push(i);
  }

  // Mutator logic
  const mutated = aged.map((e, i) => {
    if (!idxs.includes(i)) return e;
    // Reduced volatility: -3 to +5 (slight upward bias to keep threats active)
    const delta = Math.round((Math.random() * 8 - 3));
    const nextSev = clamp(e.severity + delta, 25, 99);
    const nextMomentum = momentumForDelta(delta);

    let nextConfidence: EventItem["confidence"] = e.confidence;
    // Lower probability of confidence switching (5%)
    if (Math.random() < 0.05) {
      nextConfidence = e.confidence === "LOW" ? "MED" : e.confidence === "MED" ? "HIGH" : "MED";
    }

    return {
      ...e,
      severity: nextSev,
      momentum: nextMomentum,
      confidence: nextConfidence,
      // Lower probability of summary jitter (15%)
      summary: Math.random() < 0.15 ? jitterSummary(e.summary) : e.summary,
      // Reset updated timer more aggressively if it mutated
      updatedMinutesAgo: 0,
    };
  });

  // Slow down new event generation (check every 8th tick instead of 5th)
  // And only generate if we have fewer than 18 events to prevent overcrowding
  const addNew = tick > 0 && tick % 8 === 0 && mutated.length < 18;
  if (addNew) {
    return [generateNewEvent(tick), ...mutated].slice(0, 20); // Cap at 20
  }

  return mutated;
}
