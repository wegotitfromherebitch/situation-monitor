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
    baseTitle: "Naval signaling",
    momentum: "UP",
    region: "Red Sea",
    coordinates: [15.5, 41.5],
    summary:
      "Signal volume rising across multiple monitoring channels. Escalation risk increasing; attribution and intent remain uncertain.",
    severity: 82,
    confidence: "MED",
    updatedMinutesAgo: 6,
  },
  {
    id: "evt-002",
    category: "STATE",
    baseTitle: "Leadership contest",
    momentum: "UP",
    region: "Brasilia",
    coordinates: [-15.8, -47.9],
    summary:
      "External messaging amplifying internal instability. Sustained escalation pressure likely if current trends persist.",
    severity: 67,
    confidence: "HIGH",
    updatedMinutesAgo: 18,
  },
  {
    id: "evt-003",
    category: "MARKETS",
    baseTitle: "Energy volatility",
    momentum: "FLAT",
    region: "Rotterdam Hub",
    coordinates: [51.9, 4.4],
    summary:
      "Price ranges widening amid headline-driven repricing. No clear directional consensus established.",
    severity: 58,
    confidence: "HIGH",
    updatedMinutesAgo: 12,
  },
  {
    id: "evt-004",
    category: "SECURITY",
    baseTitle: "Cross-border kinetic chatter",
    momentum: "UP",
    region: "Donbas",
    coordinates: [48.0, 38.0],
    summary:
      "Fragmented claims circulating within regional feeds. Verification incomplete, but signal density continues to build.",
    severity: 73,
    confidence: "LOW",
    updatedMinutesAgo: 24,
  },
  {
    id: "evt-005",
    category: "MARKETS",
    baseTitle: "EM FX stress",
    momentum: "UP",
    region: "Istanbul",
    coordinates: [41.0, 29.0],
    summary:
      "Currency weakness accelerating alongside volatility signals. Broader macro contagion risk under active assessment.",
    severity: 61,
    confidence: "MED",
    updatedMinutesAgo: 31,
  },
  {
    id: "evt-006",
    category: "CYBER",
    baseTitle: "Infrastructure probe",
    momentum: "UP",
    region: "Taiwan Strait",
    coordinates: [24.0, 119.5],
    summary:
      "Anomalous packet volume detected against critical grid endpoints. Signature matches APT-29 profile.",
    severity: 88,
    confidence: "HIGH",
    updatedMinutesAgo: 2,
  },
  {
    id: "evt-007",
    category: "CLIMATE",
    baseTitle: "Extreme thermal anomaly",
    momentum: "UP",
    region: "New Delhi",
    coordinates: [28.6, 77.2],
    summary:
      "Wet bulb temperature exceeding safe thresholds. Grid strain expected within 4 hours.",
    severity: 45,
    confidence: "HIGH",
    updatedMinutesAgo: 45,
  },
  {
    id: "evt-008",
    category: "SECURITY",
    baseTitle: "Troop displacement",
    momentum: "FLAT",
    region: "Sahel Border",
    coordinates: [14.0, 2.0],
    summary:
      "Satellite reconnaissance confirms new encampments. Logistic supply lines appearing active.",
    severity: 55,
    confidence: "MED",
    updatedMinutesAgo: 120,
  },
  {
    id: "evt-009",
    category: "MARKETS",
    baseTitle: "Tech sector flash crash",
    momentum: "DOWN",
    region: "New York",
    coordinates: [40.7, -74.0],
    summary:
      "Algorithmic trading triggering circuit breakers. Human traders awaiting clarity.",
    severity: 78,
    confidence: "HIGH",
    updatedMinutesAgo: 5,
  },
  {
    id: "evt-010",
    category: "CYBER",
    baseTitle: "Ransomware wave",
    momentum: "UP",
    region: "London",
    coordinates: [51.5, -0.1],
    summary:
      "Healthcare sector reporting widespread lockout. Decryption keys demanded in privacy coins.",
    severity: 92,
    confidence: "HIGH",
    updatedMinutesAgo: 1,
  },
];