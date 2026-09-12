"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Button, Card, Badge, Input } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import type { GrammarianSession } from "@/lib/types";

export default function GrammarianSessionsPage() {
  const { data, loading, addItem, removeItem } = useCollection<GrammarianSession>("/api/grammarian-sessions");
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [wordOfDay, setWordOfDay] = useState("");
  const [idiomOfDay, setIdiomOfDay] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const created = await addItem({
      createdAt: new Date().toISOString(),
      wordOfDay: wordOfDay.trim() || undefined,
      idiomOfDay: idiomOfDay.trim() || undefined,
      ended: false,
      speakers: [],
    });
    setModalOpen(false);
    setWordOfDay("");
    setIdiomOfDay("");
    router.push(`/grammarian/${created.id}`);
  }

  const sorted = [...data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Grammarian"
        description="Track word/idiom usage, good words, notable expressions, and grammar corrections."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> New Session
          </Button>
        }
      />

      <div className="flex-1 space-y-3 overflow-auto p-6">
        {!loading && sorted.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">No Grammarian sessions yet.</Card>
        )}
        {sorted.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-4 p-4">
            <Link href={`/grammarian/${s.id}`} className="flex flex-1 items-center gap-4">
              <div>
                <p className="font-medium text-slate-800">
                  Session — {new Date(s.createdAt).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-slate-500">
                  {s.speakers.length} speakers
                  {s.wordOfDay ? ` · Word: ${s.wordOfDay}` : ""}
                  {s.idiomOfDay ? ` · Idiom: ${s.idiomOfDay}` : ""} ·{" "}
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
              <Link href={`/grammarian/${s.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                <ChevronRight size={16} />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Session">
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-sm text-slate-500">
            Set the Word and Idiom of the Day. These display during every speaker&apos;s tracking session.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Word of the Day</span>
            <Input value={wordOfDay} placeholder="e.g. Eloquent" onChange={(e) => setWordOfDay(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Idiom of the Day</span>
            <Input value={idiomOfDay} placeholder="e.g. Bite the bullet" onChange={(e) => setIdiomOfDay(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Start Session →</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
