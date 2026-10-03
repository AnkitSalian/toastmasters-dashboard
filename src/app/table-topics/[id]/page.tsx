"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { TABLE_TOPICS_DIFFICULTIES, type TableTopicsDifficulty, type TableTopicsSession, type TableTopicsTopic } from "@/lib/types";

const DIFFICULTY_COLORS: Record<TableTopicsDifficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700",
};

export default function TableTopicsSetupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, updateItem } = useCollection<TableTopicsSession>("/api/table-topics-sessions");
  const session = useMemo(() => data.find((s) => s.id === params.id), [data, params.id]);

  const [drafts, setDrafts] = useState<Record<TableTopicsDifficulty, string>>({
    Easy: "",
    Intermediate: "",
    Hard: "",
  });

  const bucketStats = useMemo(() => {
    if (!session) return [];
    return TABLE_TOPICS_DIFFICULTIES.map((d) => {
      const topics = session.topics.filter((t) => t.difficulty === d);
      return { difficulty: d, total: topics.length, remaining: topics.filter((t) => !t.drawnAt).length };
    });
  }, [session]);

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading session…</div>;
  if (!session) return <div className="p-6 text-sm text-slate-400">Session not found.</div>;

  function addTopics(difficulty: TableTopicsDifficulty) {
    if (!session) return;
    const parts = drafts[difficulty]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const newTopics: TableTopicsTopic[] = parts.map((text) => ({ id: crypto.randomUUID(), text, difficulty }));
    updateItem({ ...session, topics: [...session.topics, ...newTopics] });
    setDrafts((d) => ({ ...d, [difficulty]: "" }));
  }

  function removeTopic(id: string) {
    if (!session) return;
    updateItem({ ...session, topics: session.topics.filter((t) => t.id !== id) });
  }

  const totalTopics = session.topics.length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/table-topics" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-sm font-semibold text-slate-900">Session — {session.date}</p>
            <Badge className={session.ended ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}>
              {session.ended ? "Ended" : "Setting Up"}
            </Badge>
          </div>
        </div>
        <Button onClick={() => router.push(`/table-topics/${session.id}/draw`)} disabled={totalTopics === 0}>
          Proceed to Draw <ArrowRight size={15} />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Stock Topics by Bucket</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {TABLE_TOPICS_DIFFICULTIES.map((d) => (
              <Card key={d} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={DIFFICULTY_COLORS[d]}>{d}</Badge>
                  <span className="text-xs text-slate-400">
                    {bucketStats.find((b) => b.difficulty === d)?.remaining ?? 0} /{" "}
                    {bucketStats.find((b) => b.difficulty === d)?.total ?? 0} left
                  </span>
                </div>
                <textarea
                  value={drafts[d]}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [d]: e.target.value }))}
                  placeholder="Topic one, Topic two, Topic three…"
                  rows={3}
                  className="w-full resize-none rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />
                <Button variant="secondary" size="sm" className="mt-2 w-full justify-center" onClick={() => addTopics(d)}>
                  Add to {d}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Remaining Topics by Bucket</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {TABLE_TOPICS_DIFFICULTIES.map((d) => {
              const remaining = session.topics.filter((t) => t.difficulty === d && !t.drawnAt);
              return (
                <Card key={d} className="p-4">
                  <Badge className={DIFFICULTY_COLORS[d]}>{d}</Badge>
                  {remaining.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">No topics yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {remaining.map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                          <span>{t.text}</span>
                          <button onClick={() => removeTopic(t.id)} className="shrink-0 text-slate-400 hover:text-rose-600">
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
