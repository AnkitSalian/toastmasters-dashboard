import { makeCrudHandlers } from "@/lib/crud";
import type { OutsideParticipation } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<OutsideParticipation>("outsideParticipation.json");
