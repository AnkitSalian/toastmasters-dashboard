import { makeCrudHandlers } from "@/lib/crud";
import type { TimerSession } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<TimerSession>("timerSessions.json");
