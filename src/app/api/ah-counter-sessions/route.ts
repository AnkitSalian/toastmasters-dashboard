import { makeCrudHandlers } from "@/lib/crud";
import type { AhCounterSession } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<AhCounterSession>("ahCounterSessions.json");
