import type { SpeechTypeKey, TimerStatus } from "@/lib/types";

export const GRACE_SECONDS = 30;
export const WORD_IDIOM_CYCLE_SECONDS = 15;

export const SPEECH_TYPES: Record<
  SpeechTypeKey,
  {
    key: SpeechTypeKey;
    label: string;
    shortLabel: string;
    green: number;
    yellow: number;
    red: number;
    hasGraceBefore: boolean;
    hasGraceAfter: boolean;
  }
> = {
  tableTopics: {
    key: "tableTopics",
    label: "Table Topics",
    shortLabel: "Table Topics (1-2 min)",
    green: 60,
    yellow: 90,
    red: 120,
    hasGraceBefore: false,
    hasGraceAfter: true,
  },
  evaluation: {
    key: "evaluation",
    label: "Evaluation",
    shortLabel: "Evaluation (2-3 min)",
    green: 120,
    yellow: 150,
    red: 180,
    hasGraceBefore: true,
    hasGraceAfter: true,
  },
  speech: {
    key: "speech",
    label: "Speech",
    shortLabel: "Speech (5-7 min)",
    green: 300,
    yellow: 360,
    red: 420,
    hasGraceBefore: true,
    hasGraceAfter: true,
  },
  custom: {
    key: "custom",
    label: "Custom",
    shortLabel: "Custom Time",
    green: 300,
    yellow: 360,
    red: 420,
    hasGraceBefore: true,
    hasGraceAfter: true,
  },
};

export function formatTime(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalSeconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}:${String(s).padStart(2, "0")}`;
}

export type Phase = "pre" | "pre-grace" | "green" | "yellow" | "red" | "disqualified";

interface GraceFlags {
  hasGraceBefore: boolean;
  hasGraceAfter: boolean;
}

/** Phase drives the full-screen background color. */
export function getPhase(
  elapsed: number,
  thresholds: { green: number; yellow: number; red: number },
  { hasGraceBefore, hasGraceAfter }: GraceFlags
): Phase {
  const { green, yellow, red } = thresholds;
  if (elapsed < green) {
    if (hasGraceBefore && elapsed >= green - GRACE_SECONDS) return "pre-grace";
    return "pre";
  }
  if (elapsed < yellow) return "green";
  if (elapsed < red) return "yellow";
  if (hasGraceAfter) {
    return elapsed < red + GRACE_SECONDS ? "red" : "disqualified";
  }
  return "red";
}

/** Final scoring status, computed once timing stops. */
export function getStatus(
  elapsed: number,
  thresholds: { green: number; yellow: number; red: number },
  flags: GraceFlags
): TimerStatus {
  const { green, red } = thresholds;
  const phase = getPhase(elapsed, thresholds, flags);
  if (phase === "disqualified") return "disqualified";
  const underFloor = flags.hasGraceBefore ? green - GRACE_SECONDS : green;
  if (elapsed < underFloor) return "under";
  if (!flags.hasGraceAfter && elapsed >= red) return "over";
  return "qualified";
}

// Badge text intentionally never mentions "grace" or "disqualified" — the
// live screen only communicates state through the STANDBY/GREEN/YELLOW/RED
// zone, never a call-out that the speaker is in a grace window or has been
// disqualified. That status still exists internally (see getStatus) and
// shows up in the session report.
export const PHASE_META: Record<Phase, { label: string; badge: string }> = {
  pre: { label: "Standing By", badge: "STANDBY" },
  "pre-grace": { label: "Standing By", badge: "STANDBY" },
  green: { label: "Green", badge: "GREEN" },
  yellow: { label: "Yellow", badge: "YELLOW" },
  red: { label: "Red", badge: "RED" },
  disqualified: { label: "Red", badge: "RED" },
};

export const STATUS_META: Record<TimerStatus, { label: string; tone: "good" | "warn" | "bad" }> = {
  under: { label: "Under Time", tone: "warn" },
  qualified: { label: "Qualified", tone: "good" },
  over: { label: "Over Time", tone: "warn" },
  disqualified: { label: "Disqualified", tone: "bad" },
};

export const ZONE_COLORS = {
  pre: "#0c0c11",
  preGrace: "#122236",
  green: "#1c8a4c",
  yellow: "#d19a1f",
  red: "#c23a2c",
} as const;

// "disqualified" intentionally reuses the same solid red as "red": once the
// speaker is past the final grace window the screen holds steady, it does
// not switch color or blink.
export const PHASE_BG: Record<Phase, string> = {
  pre: "bg-[#0c0c11]",
  "pre-grace": "bg-[#122236]",
  green: "bg-[#1c8a4c]",
  yellow: "bg-[#d19a1f] text-[#241a02]",
  red: "bg-[#c23a2c]",
  disqualified: "bg-[#c23a2c]",
};

export const STATUS_BADGE: Record<TimerStatus, string> = {
  qualified: "bg-emerald-500/15 text-emerald-400",
  under: "bg-amber-500/15 text-amber-300",
  over: "bg-amber-500/15 text-amber-300",
  disqualified: "bg-rose-500/15 text-rose-400",
};
