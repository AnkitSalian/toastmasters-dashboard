import { makeCrudHandlers } from "@/lib/crud";
import type { MentorAssignment } from "@/lib/types";

export const { GET, POST, PUT, DELETE } = makeCrudHandlers<MentorAssignment>("mentorAssignments.json");
