"use client";

import { createContext, useContext } from "react";
import { useCollection } from "@/lib/useCollection";
import type { Member } from "@/lib/types";

type MembersContextValue = ReturnType<typeof useCollection<Member>>;

const MembersContext = createContext<MembersContextValue | null>(null);

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const collection = useCollection<Member>("/api/members");
  return <MembersContext.Provider value={collection}>{children}</MembersContext.Provider>;
}

/** Shared, app-wide members list so every NameField/NameMultiField sees the same live data —
 * adding a member via one field immediately shows up as a suggestion in every other field. */
export function useMembers() {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error("useMembers must be used within a MembersProvider");
  return ctx;
}
