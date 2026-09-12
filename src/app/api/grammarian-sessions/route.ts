import { makeCrudHandlers } from "@/lib/crud";
import type { GrammarianSession } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<GrammarianSession>("grammarianSessions.json");
