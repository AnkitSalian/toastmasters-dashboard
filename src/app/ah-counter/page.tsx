"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button, Card, Badge } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import type { AhCounterSession } from "@/lib/types";

export default function AhCounterSessionsPage() {
  const { data, loading, addItem, removeItem } = useCollection<AhCounterSession>("/api/ah-counter-sessions");
  const router = useRouter();

  async function handleNewSession() {
    const created = await addItem({ date: new Date().toISOString().slice(0, 10), entries: [], ended: false });
    router.push(`/ah-counter/${created.id}`);
  }

  const sorted = [...data].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Ah-Counter"
        description="Tally filler sounds, crutch words, pauses, and repetitions per speaker."
        actions={
          <Button onClick={handleNewSession}>
            <Plus size={15} /> New Session
          </Button>
        }
      />

      <div className="flex-1 space-y-3 overflow-auto p-6">
        {!loading && sorted.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">No Ah-Counter sessions yet.</Card>
        )}
        {sorted.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-4 p-4">
            <Link href={`/ah-counter/${s.id}`} className="flex flex-1 items-center gap-4">
              <div>
                <p className="font-medium text-slate-800">Session — {s.date}</p>
                <p className="text-xs text-slate-500">
                  {s.entries.length} speaker{s.entries.length === 1 ? "" : "s"} ·{" "}
                  <Badge className={s.ended ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}>
                    {s.ended ? "Ended" : "Active"}
                  </Badge>
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => removeItem(s.id)}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
              >
                <Trash2 size={14} />
              </button>
              <Link href={`/ah-counter/${s.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <ChevronRight size={16} />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
