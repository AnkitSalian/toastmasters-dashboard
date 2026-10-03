"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Pencil, Shuffle } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { TABLE_TOPICS_DIFFICULTIES, type TableTopicsDifficulty, type TableTopicsSession, type TableTopicsTopic } from "@/lib/types";
import { exportToExcel } from "@/lib/exportExcel";

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const DIFFICULTY_COLORS: Record<TableTopicsDifficulty, { badge: string; ring: string; button: string }> = {
  Easy: { badge: "bg-emerald-100 text-emerald-700", ring: "border-emerald-200", button: "border-emerald-200 hover:bg-emerald-50" },
  Intermediate: { badge: "bg-amber-100 text-amber-700", ring: "border-amber-200", button: "border-amber-200 hover:bg-amber-50" },
  Hard: { badge: "bg-rose-100 text-rose-700", ring: "border-rose-200", button: "border-rose-200 hover:bg-rose-50" },
};

export default function TableTopicsDrawPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, updateItem } = useCollection<TableTopicsSession>("/api/table-topics-sessions");
  const session = useMemo(() => data.find((s) => s.id === params.id), [data, params.id]);

  const [justDrawn, setJustDrawn] = useState<TableTopicsTopic | null>(null);

  const bucketStats = useMemo(() => {
    if (!session) return [];
    return TABLE_TOPICS_DIFFICULTIES.map((d) => {
      const topics = session.topics.filter((t) => t.difficulty === d);
      return { difficulty: d, total: topics.length, remaining: topics.filter((t) => !t.drawnAt).length };
    });
  }, [session]);

  const draws = useMemo(() => {
    if (!session) return [];
    return session.topics
      .filter((t) => t.drawnAt)
      .sort((a, b) => ((a.drawnAt ?? "") < (b.drawnAt ?? "") ? 1 : -1));
  }, [session]);

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading session…</div>;
  if (!session) return <div className="p-6 text-sm text-slate-400">Session not found.</div>;

  function handleDrawFrom(difficulty: TableTopicsDifficulty) {
    if (!session || session.ended) return;
    const pool = session.topics.filter((t) => t.difficulty === difficulty && !t.drawnAt);
    if (pool.length === 0) return;
    const pick = pickRandom(pool);
    const drawnAt = new Date().toISOString();
    updateItem({
      ...session,
      topics: session.topics.map((t) => (t.id === pick.id ? { ...t, drawnAt } : t)),
    });
    setJustDrawn({ ...pick, drawnAt });
  }

  function endSession() {
    if (!session) return;
    updateItem({ ...session, ended: true });
  }

  async function handleExport() {
    if (!session) return;
    await exportToExcel({
      fileName: `table-topics-${session.date}`,
      sheetName: "Table Topics",
      columns: [
        { key: "difficulty", header: "Difficulty", width: 14 },
        { key: "text", header: "Topic", width: 50 },
        { key: "drawnAt", header: "Drawn At", width: 22 },
      ],
      rows: draws,
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/table-topics/${session.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-sm font-semibold text-slate-900">Session — {session.date}</p>
            <Badge className={session.ended ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}>
              {session.ended ? "Ended" : "Active"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/table-topics/${session.id}`}>
            <Button variant="secondary">
              <Pencil size={15} /> Edit Topics
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleExport} disabled={draws.length === 0}>
            <Download size={15} /> Export
          </Button>
          {!session.ended && <Button onClick={endSession}>End Session</Button>}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Pick a Bucket</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TABLE_TOPICS_DIFFICULTIES.map((d) => {
              const stat = bucketStats.find((b) => b.difficulty === d);
              const disabled = session.ended || !stat || stat.remaining === 0;
              return (
                <button
                  key={d}
                  onClick={() => handleDrawFrom(d)}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 bg-white p-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${DIFFICULTY_COLORS[d].button}`}
                >
                  <Badge className={DIFFICULTY_COLORS[d].badge}>{d}</Badge>
                  <Shuffle size={22} className="text-slate-400" />
                  <p className="text-xs text-slate-500">{stat?.remaining ?? 0} left</p>
                </button>
              );
            })}
          </div>
        </div>

        {justDrawn && (
          <Card className={`border-2 ${DIFFICULTY_COLORS[justDrawn.difficulty].ring} p-6 text-center`}>
            <Badge className={DIFFICULTY_COLORS[justDrawn.difficulty].badge}>{justDrawn.difficulty}</Badge>
            <p className="mt-3 text-xl font-semibold text-slate-900">{justDrawn.text}</p>
          </Card>
        )}

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Draw History</p>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                    <th className="px-4 py-2.5">Difficulty</th>
                    <th className="px-4 py-2.5">Topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draws.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                        No topics drawn yet.
                      </td>
                    </tr>
                  )}
                  {draws.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Badge className={DIFFICULTY_COLORS[t.difficulty].badge}>{t.difficulty}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{t.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
