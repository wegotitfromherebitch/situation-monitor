export type Category = "SECURITY" | "STATE" | "MARKETS";

export type EventItem = {
  id: string;
  category: Category;
  baseTitle: string;
  titleOverride?: string;
  momentum?: "UP" | "FLAT" | "DOWN";
  region: string;
  summary: string;
  severity: number; // 0–100
  confidence: "LOW" | "MED" | "HIGH";
  updatedMinutesAgo: number;
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
    region: "Middle East",
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
    region: "South America",
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
    region: "Global",
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
    region: "Eastern Europe",
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
    region: "EM",
    summary:
      "Currency weakness accelerating alongside volatility signals. Broader macro contagion risk under active assessment.",
    severity: 61,
    confidence: "MED",
    updatedMinutesAgo: 31,
  },
];