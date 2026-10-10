import type { Meeting } from "@/lib/types";

export const MEETING_COLUMNS: { key: keyof Meeting; header: string }[] = [
  { key: "meetingNumber", header: "Mtg #" },
  { key: "speaker1", header: "Speaker 1" },
  { key: "speaker2", header: "Speaker 2" },
  { key: "speaker3", header: "Speaker 3" },
  { key: "evaluator1", header: "Evaluator 1" },
  { key: "evaluator2", header: "Evaluator 2" },
  { key: "evaluator3", header: "Evaluator 3" },
  { key: "tmodName", header: "TMOD" },
  { key: "tmodTheme", header: "TMOD Theme" },
  { key: "ahCounter", header: "Ah-Counter" },
  { key: "grammarian", header: "Grammarian" },
  { key: "timer", header: "Timer" },
  { key: "tableTopicMaster", header: "Table Topic Master" },
  { key: "generalEvaluator", header: "General Evaluator" },
];

export const MEETING_WINNER_COLUMNS: { key: keyof Meeting; header: string }[] = [
  { key: "bestSpeaker", header: "Best Speaker" },
  { key: "bestEvaluator", header: "Best Evaluator" },
  { key: "bestOfBig3", header: "Best of Big 3" },
  { key: "bestTagPlayer", header: "Best TAG Player" },
];
