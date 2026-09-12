import { makeCrudHandlers } from "@/lib/crud";
import type { Meeting } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<Meeting>("meetings.json");
