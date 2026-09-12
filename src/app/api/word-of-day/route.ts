import { makeCrudHandlers } from "@/lib/crud";
import type { WordOfDayEntry } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<WordOfDayEntry>("wordOfDay.json");
