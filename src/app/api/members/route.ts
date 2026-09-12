import { makeCrudHandlers } from "@/lib/crud";
import type { Member } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<Member>("members.json");
