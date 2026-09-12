import { makeCrudHandlers } from "@/lib/crud";
import type { LevelCompletion } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<LevelCompletion>("levelCompletions.json");
