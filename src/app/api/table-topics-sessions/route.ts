import { makeCrudHandlers } from "@/lib/crud";
import type { TableTopicsSession } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<TableTopicsSession>("tableTopicsSessions.json");
