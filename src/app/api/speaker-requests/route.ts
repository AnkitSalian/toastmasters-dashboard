import { makeCrudHandlers } from "@/lib/crud";
import type { SpeakerRequest } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<SpeakerRequest>("speakerRequests.json");
