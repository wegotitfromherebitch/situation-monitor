export type Category = "SECURITY" | "STATE" | "MARKETS" | "CYBER" | "CLIMATE";

export type EventItem = {
  id: string;
  category: Category;
  baseTitle: string;
  titleOverride?: string;
  momentum?: "UP" | "FLAT" | "DOWN";
  region: string;
  coordinates: [number, number]; // [lat, lng]
  summary: string;
  severity: number; // 0–100
  confidence: "LOW" | "MED" | "HIGH";
  updatedMinutesAgo: number;
  url?: string;
  source?: string;
};

export type TitleState = "EMERGING" | "INTENSIFYING" | "SUSTAINED" | "EASING" | "DORMANT";

export function titleStateFor(e: EventItem): TitleState {
  const m = e.updatedMinutesAgo;
  const momentum = e.momentum ?? "FLAT";

  if (m <= 8) return "EMERGING";
  if (m <= 30) {
    if (momentum === "UP") return "INTENSIFYING";
    if (momentum === "DOWN") return "EASING";
    return "SUSTAINED";
  }
  if (m <= 120) {
    if (momentum === "DOWN") return "EASING";
    return "SUSTAINED";
  }
  return "DORMANT";
}

export function displayTitleFor(e: EventItem): string {
  if (e.titleOverride && e.titleOverride.trim().length > 0) return e.titleOverride.trim();

  const base = e.baseTitle;
  const state = titleStateFor(e);

  switch (state) {
    case "EMERGING":
      return `${base} emerging`;
    case "INTENSIFYING":
      return `${base} intensifying`;
    case "SUSTAINED":
      return `Sustained ${base}`;
    case "EASING":
      return `${base} easing`;
    case "DORMANT":
      return `Residual ${base}`;
  }
}

export const EVENTS: EventItem[] = [
  {
    id: "evt-001",
    category: "SECURITY",
    baseTitle: "Naval deployment",
    momentum: "UP",
    region: "Red Sea",
    coordinates: [13.2500, 42.7500],
    summary:
      "Increased ship activity in restricted zones. Escalation risk high; tracking units currently unidentifiable.",
    severity: 82,
    confidence: "MED",
    updatedMinutesAgo: 6,
  },
  {
    id: "evt-002",
    category: "STATE",
    baseTitle: "Government instability",
    momentum: "UP",
    region: "Brasilia",
    coordinates: [-15.7975, -47.8919],
    summary:
      "Civil unrest reported near capital. Military presence increasing in urban centers.",
    severity: 67,
    confidence: "HIGH",
    updatedMinutesAgo: 18,
  },
  {
    id: "evt-003",
    category: "MARKETS",
    baseTitle: "Oil supply disruption",
    momentum: "FLAT",
    region: "Rotterdam Port",
    coordinates: [51.9225, 4.4792],
    summary:
      "Major refinery outage reported. Crude prices fluctuating 8% above baseline.",
    severity: 58,
    confidence: "HIGH",
    updatedMinutesAgo: 12,
  },
  {
    id: "evt-004",
    category: "SECURITY",
    baseTitle: "Border clashes",
    momentum: "UP",
    region: "Donetsk",
    coordinates: [48.0159, 37.8028],
    summary:
      "Artillery fire confirmed along the buffer zone. Local units reporting multiple fatalities.",
    severity: 73,
    confidence: "LOW",
    updatedMinutesAgo: 24,
  },
  {
    id: "evt-005",
    category: "MARKETS",
    baseTitle: "Currency crash",
    momentum: "UP",
    region: "Istanbul",
    coordinates: [41.0082, 28.9784],
    summary:
      "Local currency dropped 15% against USD. Central bank intervention failing.",
    severity: 61,
    confidence: "MED",
    updatedMinutesAgo: 31,
  },
  {
    id: "evt-006",
    category: "CYBER",
    baseTitle: "Power grid attack",
    momentum: "UP",
    region: "Taiwan Strait",
    coordinates: [24.4798, 119.8510],
    summary:
      "Malware detected in grid control systems. Targeted outage affecting 2M residents.",
    severity: 88,
    confidence: "HIGH",
    updatedMinutesAgo: 2,
  },
  {
    id: "evt-007",
    category: "CLIMATE",
    baseTitle: "Extreme heat warning",
    momentum: "UP",
    region: "New Delhi",
    coordinates: [28.6139, 77.2090],
    summary:
      "Temperatures exceeding 50°C. Water scarcity reports increasing; public health emergency declared.",
    severity: 45,
    confidence: "HIGH",
    updatedMinutesAgo: 45,
  },
  {
    id: "evt-008",
    category: "SECURITY",
    baseTitle: "Military mobilization",
    momentum: "FLAT",
    region: "Gao (Sahel)",
    coordinates: [16.2717, -0.0447],
    summary:
      "New tactical positions established along border. Logistics units moving heavy equipment south.",
    severity: 55,
    confidence: "MED",
    updatedMinutesAgo: 120,
  },
  {
    id: "evt-009",
    category: "MARKETS",
    baseTitle: "Stock market crash",
    momentum: "DOWN",
    region: "New York",
    coordinates: [40.7128, -74.0060],
    summary:
      "Panic selling in tech sector. NASDAQ down 4% in 30 minutes; trading halted on 12 tickers.",
    severity: 78,
    confidence: "HIGH",
    updatedMinutesAgo: 5,
  },
  {
    id: "evt-010",
    category: "CYBER",
    baseTitle: "Ransomware attack",
    momentum: "UP",
    region: "London",
    coordinates: [51.5074, -0.1278],
    summary:
      "Major hospital network locked out. Emergency services diverted; patient data exposed.",
    severity: 92,
    confidence: "HIGH",
    updatedMinutesAgo: 1,
  },
];