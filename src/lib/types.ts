export const MEETING_TYPES = [
  "Regular Club Meeting",
  "Contest",
  "Education Session",
  "Open House",
  "Demo/Kickoff",
  "Speciality & Themed Meeting",
] as const;

export type MeetingType = (typeof MEETING_TYPES)[number];

export const MEETING_TIMES = ["12:00 PM – 1:30 PM", "2:00 PM – 3:30 PM"] as const;

export type MeetingTime = (typeof MEETING_TIMES)[number];

export const MEETING_TYPE_COLORS: Record<MeetingType, { bg: string; text: string; dot: string }> = {
  "Regular Club Meeting": { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  Contest: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  "Education Session": { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
  "Open House": { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  "Demo/Kickoff": { bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-500" },
  "Speciality & Themed Meeting": { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
};

export interface Meeting {
  id: string;
  date: string; // ISO yyyy-mm-dd
  meetingTime: MeetingTime | string;
  meetingType: MeetingType;
  meetingNumber: string;
  speaker1: string;
  speaker2: string;
  speaker3: string;
  evaluator1: string;
  evaluator2: string;
  evaluator3: string;
  tmodName: string;
  tmodTheme: string;
  ahCounter: string;
  grammarian: string;
  timer: string;
  tableTopicMaster: string;
  generalEvaluator: string;
  bestSpeaker: string[];
  bestEvaluator: string[];
  bestOfBig3: string[];
  bestTagPlayer: string[];
}

export type SpeakerRequestStatus = "Pending" | "Assigned";

export interface SpeakerRequest {
  id: string;
  speakerName: string;
  date: string;
  speechDescription: string;
  speechLength: number; // minutes
  status: SpeakerRequestStatus;
}

export interface OutsideParticipation {
  id: string;
  name: string;
  date: string;
  role: string;
  clubName: string;
}

export const PATHWAY_LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"] as const;

export interface LevelCompletion {
  id: string;
  name: string;
  level: (typeof PATHWAY_LEVELS)[number] | string;
  pathwayName: string;
  dateOfCompletion: string;
}

export interface MentorAssignment {
  id: string;
  speakerName: string;
  mentorName: string;
}

export interface WordOfDayEntry {
  id: string;
  meetingDate: string;
  word: string;
  wordMeaning?: string;
  idiom?: string;
  idiomMeaning?: string;
}

export type SpeechTypeKey = "tableTopics" | "evaluation" | "speech" | "custom";

export type TimerStatus = "under" | "qualified" | "over" | "disqualified";

export interface TimerSpeaker {
  id: string;
  speakerName: string;
  speechTypeKey: SpeechTypeKey;
  speechTypeLabel: string;
  hasGraceBefore: boolean;
  hasGraceAfter: boolean;
  green: number; // seconds
  yellow: number;
  red: number;
  showTime: boolean;
  elapsedSeconds?: number;
  status?: TimerStatus;
}

export interface TimerSession {
  id: string;
  createdAt: string;
  wordOfDay: string;
  idiomOfDay: string;
  ended: boolean;
  speakers: TimerSpeaker[];
}

export interface AhCounterEntry {
  id: string;
  speakerName: string;
  ahh: number;
  err: number;
  umm: number;
  and: number;
  well: number;
  but: number;
  so: number;
  youKnow: number;
  longPause: number;
  shortPause: number;
  repetitionI: number;
  repetitionThisMeans: number;
  remarks?: string;
}

export interface AhCounterSession {
  id: string;
  date: string;
  entries: AhCounterEntry[];
  ended: boolean;
}

export interface GrammarianSpeaker {
  id: string;
  speakerName: string;
  speechType: string;
  wordUsed: number;
  idiomUsed: number;
  goodWords: string[];
  expressions: string[];
  corrections: string[];
  startTime?: string;
  endTime?: string;
}

export interface GrammarianSession {
  id: string;
  createdAt: string;
  wordOfDay?: string;
  idiomOfDay?: string;
  ended: boolean;
  speakers: GrammarianSpeaker[];
}

// The 11 standard Toastmasters Pathways — offered as a pick-list so pathway
// names stay consistent across Members instead of being freely retyped.
export const PATHWAY_NAMES = [
  "Dynamic Leadership",
  "Effective Coaching",
  "Engaging Humor",
  "Innovative Planning",
  "Leadership Development",
  "Motivational Strategies",
  "Persuasive Influence",
  "Presentation Mastery",
  "Strategic Relationships",
  "Team Collaboration",
  "Visionary Communication",
] as const;

export interface Member {
  id: string;
  name: string;
  pathways: string[];
  membershipActive: boolean;
  clubRole: string;
  joinDate?: string;
  membershipExpiry?: string;
  email?: string;
  phone?: string;
}
