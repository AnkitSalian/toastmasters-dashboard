import type { Meeting } from "@/lib/types";

export const ROLE_COLUMNS: { key: keyof Meeting | "speaker" | "evaluator"; label: string }[] = [
  { key: "speaker", label: "Speaker" },
  { key: "evaluator", label: "Evaluator" },
  { key: "tmodName", label: "TMOD" },
  { key: "tableTopicMaster", label: "TT Master" },
  { key: "generalEvaluator", label: "Gen. Evaluator" },
  { key: "timer", label: "Timer" },
  { key: "ahCounter", label: "Ah-Counter" },
  { key: "grammarian", label: "Grammarian" },
];

export const WIN_COLUMNS: { key: keyof Meeting; label: string }[] = [
  { key: "bestSpeaker", label: "Win: Speaker" },
  { key: "bestEvaluator", label: "Win: Evaluator" },
  { key: "bestOfBig3", label: "Win: Big 3" },
  { key: "bestTagPlayer", label: "Win: TAG" },
];

export const RADAR_COLUMNS = [...ROLE_COLUMNS, ...WIN_COLUMNS];

/** The 12 individual meeting fields that represent "took a role that meeting". */
export const ROLE_FIELDS: (keyof Meeting)[] = [
  "speaker1",
  "speaker2",
  "speaker3",
  "evaluator1",
  "evaluator2",
  "evaluator3",
  "tmodName",
  "tableTopicMaster",
  "generalEvaluator",
  "timer",
  "ahCounter",
  "grammarian",
];

/** Maps each individual meeting field to its human label and tally bucket. */
export const ROLE_FIELD_INFO: { key: keyof Meeting; label: string; bucket: string }[] = [
  { key: "speaker1", label: "Speaker", bucket: "speaker" },
  { key: "speaker2", label: "Speaker", bucket: "speaker" },
  { key: "speaker3", label: "Speaker", bucket: "speaker" },
  { key: "evaluator1", label: "Evaluator", bucket: "evaluator" },
  { key: "evaluator2", label: "Evaluator", bucket: "evaluator" },
  { key: "evaluator3", label: "Evaluator", bucket: "evaluator" },
  { key: "tmodName", label: "TMOD", bucket: "tmodName" },
  { key: "tableTopicMaster", label: "Table Topic Master", bucket: "tableTopicMaster" },
  { key: "generalEvaluator", label: "General Evaluator", bucket: "generalEvaluator" },
  { key: "timer", label: "Timer", bucket: "timer" },
  { key: "ahCounter", label: "Ah-Counter", bucket: "ahCounter" },
  { key: "grammarian", label: "Grammarian", bucket: "grammarian" },
];

export const AWARD_FIELD_INFO: { key: keyof Meeting; label: string; bucket: string }[] = [
  { key: "bestSpeaker", label: "Best Speaker", bucket: "bestSpeaker" },
  { key: "bestEvaluator", label: "Best Evaluator", bucket: "bestEvaluator" },
  { key: "bestOfBig3", label: "Best of Big 3", bucket: "bestOfBig3" },
  { key: "bestTagPlayer", label: "Best TAG Player", bucket: "bestTagPlayer" },
];

export type Tally = Record<string, Record<string, number>>;

export function addTally(tally: Tally, member: string, column: string) {
  if (!member.trim() || member.trim().toUpperCase() === "NA") return;
  const name = member.trim();
  tally[name] ??= {};
  tally[name][column] = (tally[name][column] ?? 0) + 1;
}

/** Builds a {member -> {roleBucket -> count}} tally across the given meetings. */
export function buildTally(meetings: Meeting[]): Tally {
  const t: Tally = {};
  for (const m of meetings) {
    addTally(t, m.speaker1, "speaker");
    addTally(t, m.speaker2, "speaker");
    addTally(t, m.speaker3, "speaker");
    addTally(t, m.evaluator1, "evaluator");
    addTally(t, m.evaluator2, "evaluator");
    addTally(t, m.evaluator3, "evaluator");
    addTally(t, m.tmodName, "tmodName");
    addTally(t, m.tableTopicMaster, "tableTopicMaster");
    addTally(t, m.generalEvaluator, "generalEvaluator");
    addTally(t, m.timer, "timer");
    addTally(t, m.ahCounter, "ahCounter");
    addTally(t, m.grammarian, "grammarian");
    m.bestSpeaker.forEach((name) => addTally(t, name, "bestSpeaker"));
    m.bestEvaluator.forEach((name) => addTally(t, name, "bestEvaluator"));
    m.bestOfBig3.forEach((name) => addTally(t, name, "bestOfBig3"));
    m.bestTagPlayer.forEach((name) => addTally(t, name, "bestTagPlayer"));
  }
  return t;
}
