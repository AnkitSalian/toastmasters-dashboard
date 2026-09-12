"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, Plus, X, Download } from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { NameField } from "@/components/NameField";
import Counter from "@/components/Counter";
import { useCollection } from "@/lib/useCollection";
import type { AhCounterEntry, AhCounterSession } from "@/lib/types";
import { exportToExcel } from "@/lib/exportExcel";

const CATEGORY_COLUMNS: { key: keyof AhCounterEntry; label: string; group: string }[] = [
  { key: "ahh", label: "Ahh", group: "Filler Sounds" },
  { key: "err", label: "Err", group: "Filler Sounds" },
  { key: "umm", label: "Umm", group: "Filler Sounds" },
  { key: "and", label: "And", group: "Crutch Words" },
  { key: "well", label: "Well", group: "Crutch Words" },
  { key: "but", label: "But", group: "Crutch Words" },
  { key: "so", label: "So", group: "Crutch Words" },
  { key: "youKnow", label: "You Know", group: "Crutch Words" },
  { key: "longPause", label: "Long Pause", group: "Pauses" },
  { key: "shortPause", label: "Short Pause", group: "Pauses" },
  { key: "repetitionI", label: "I", group: "Repetitions" },
  { key: "repetitionThisMeans", label: "This Means", group: "Repetitions" },
];

const FAMILY_COLORS: Record<string, string> = {
  "Filler Sounds": "#ef4444",
  "Crutch Words": "#f59e0b",
  Pauses: "#3b82f6",
  Repetitions: "#8b5cf6",
};

const METRIC_COLORS: Record<string, string> = {
  ahh: "#ef4444",
  err: "#f87171",
  umm: "#fca5a5",
  and: "#f59e0b",
  well: "#fbbf24",
  but: "#fcd34d",
  so: "#fde68a",
  youKnow: "#fef08a",
  longPause: "#3b82f6",
  shortPause: "#93c5fd",
  repetitionI: "#8b5cf6",
  repetitionThisMeans: "#c4b5fd",
};

function blankEntry(): AhCounterEntry {
  return {
    id: crypto.randomUUID(),
    speakerName: "",
    ahh: 0,
    err: 0,
    umm: 0,
    and: 0,
    well: 0,
    but: 0,
    so: 0,
    youKnow: 0,
    longPause: 0,
    shortPause: 0,
    repetitionI: 0,
    repetitionThisMeans: 0,
    remarks: "",
  };
}

function total(e: AhCounterEntry) {
  return CATEGORY_COLUMNS.reduce((sum, c) => sum + (Number(e[c.key]) || 0), 0);
}

function cellTone(value: number) {
  if (value >= 10) return "bg-rose-100 text-rose-900";
  if (value >= 6) return "bg-amber-100 text-amber-900";
  if (value >= 1) return "bg-emerald-100 text-emerald-900";
  return "";
}

function FamilyLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
      {Object.entries(FAMILY_COLORS).map(([name, color]) => (
        <span key={name} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          {name}
        </span>
      ))}
    </div>
  );
}

export default function AhCounterSessionPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, updateItem } = useCollection<AhCounterSession>("/api/ah-counter-sessions");
  const session = useMemo(() => data.find((s) => s.id === params.id), [data, params.id]);

  const chartData = useMemo(
    () =>
      (session?.entries ?? []).map((e) => {
        const row: Record<string, string | number> = { name: e.speakerName || "Unnamed" };
        CATEGORY_COLUMNS.forEach((c) => {
          row[c.label] = Number(e[c.key]) || 0;
        });
        return row;
      }),
    [session]
  );

  const pieParents = useMemo(() => {
    if (!session) return [];
    const totals: Record<string, number> = { "Filler Sounds": 0, "Crutch Words": 0, Pauses: 0, Repetitions: 0 };
    session.entries.forEach((e) => {
      CATEGORY_COLUMNS.forEach((c) => {
        totals[c.group] += Number(e[c.key]) || 0;
      });
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value, color: FAMILY_COLORS[name] }))
      .filter((d) => d.value > 0);
  }, [session]);

  const pieChildren = useMemo(() => {
    if (!session) return [];
    return CATEGORY_COLUMNS.map((c) => ({
      name: c.label,
      value: session.entries.reduce((sum, e) => sum + (Number(e[c.key]) || 0), 0),
      color: METRIC_COLORS[c.key],
    })).filter((d) => d.value > 0);
  }, [session]);

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading session…</div>;
  if (!session) return <div className="p-6 text-sm text-slate-400">Session not found.</div>;

  function updateEntry(id: string, patch: Partial<AhCounterEntry>) {
    if (!session) return;
    updateItem({
      ...session,
      entries: session.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  function addSpeaker() {
    if (!session) return;
    updateItem({ ...session, entries: [...session.entries, blankEntry()] });
  }

  function removeSpeaker(id: string) {
    if (!session) return;
    updateItem({ ...session, entries: session.entries.filter((e) => e.id !== id) });
  }

  function endSession() {
    if (!session) return;
    updateItem({ ...session, ended: true });
  }

  async function handleExport() {
    if (!session) return;
    await exportToExcel({
      fileName: `ah-counter-${session.date}`,
      sheetName: "Ah-Counter",
      columns: [
        { key: "speakerName", header: "Speaker", width: 20 },
        ...CATEGORY_COLUMNS.map((c) => ({ key: c.key, header: c.label, width: 12 })),
        { key: "total", header: "Total", width: 10 },
        { key: "remarks", header: "Remarks", width: 24 },
      ],
      rows: session.entries.map((e) => ({ ...e, total: total(e) })),
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/ah-counter" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
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
          <Button variant="secondary" onClick={handleExport}>
            <Download size={15} /> Export
          </Button>
          {!session.ended && (
            <>
              <Button variant="secondary" onClick={addSpeaker}>
                <Plus size={15} /> Add Speaker
              </Button>
              <Button onClick={endSession}>End Session</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <Card className="overflow-hidden">
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <th rowSpan={2} className="sticky left-0 z-10 bg-slate-900 px-3 py-2 align-bottom">
                    Speaker
                  </th>
                  <th colSpan={3} className="border-l border-slate-700 px-2 py-1 text-center">
                    Filler Sounds
                  </th>
                  <th colSpan={5} className="border-l border-slate-700 px-2 py-1 text-center">
                    Crutch Words
                  </th>
                  <th colSpan={2} className="border-l border-slate-700 px-2 py-1 text-center">
                    Pauses
                  </th>
                  <th colSpan={2} className="border-l border-slate-700 px-2 py-1 text-center">
                    Repetitions
                  </th>
                  <th rowSpan={2} className="border-l border-slate-700 px-2 py-2 align-bottom">
                    Total
                  </th>
                  <th rowSpan={2} className="px-2 py-2 align-bottom">
                    Remarks
                  </th>
                  {!session.ended && <th rowSpan={2} className="px-2 py-2" />}
                </tr>
                <tr className="bg-slate-800 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                  {CATEGORY_COLUMNS.map((c, i) => (
                    <th key={c.key} className={`px-2 py-1.5 text-center ${i === 0 || i === 3 || i === 8 || i === 10 ? "border-l border-slate-700" : ""}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {session.entries.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-4 py-8 text-center text-slate-400">
                      No speakers added yet.
                    </td>
                  </tr>
                )}
                {session.entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 min-w-[140px] bg-white px-3 py-2 hover:bg-slate-50">
                      {session.ended ? (
                        <span className="font-medium text-slate-800">{e.speakerName || "—"}</span>
                      ) : (
                        <NameField
                          value={e.speakerName}
                          placeholder="Speaker name"
                          onChange={(v) => updateEntry(e.id, { speakerName: v })}
                        />
                      )}
                    </td>
                    {CATEGORY_COLUMNS.map((c) => {
                      const value = Number(e[c.key]) || 0;
                      return (
                        <td key={c.key} className={`px-2 py-2 text-center ${cellTone(value)}`}>
                          {session.ended ? (
                            <span className="tabular-nums">{value}</span>
                          ) : (
                            <Counter value={value} onChange={(v) => updateEntry(e.id, { [c.key]: v } as Partial<AhCounterEntry>)} />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center font-semibold text-slate-900">{total(e)}</td>
                    <td className="min-w-[160px] px-2 py-2">
                      {session.ended ? (
                        <span className="text-slate-500">{e.remarks || "—"}</span>
                      ) : (
                        <Input
                          value={e.remarks ?? ""}
                          placeholder="Notes…"
                          onChange={(ev) => updateEntry(e.id, { remarks: ev.target.value })}
                        />
                      )}
                    </td>
                    {!session.ended && (
                      <td className="px-2 py-2">
                        <button onClick={() => removeSpeaker(e.id)} className="text-slate-400 hover:text-rose-600">
                          <X size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {session.ended && session.entries.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Count per Speaker</p>
              <p className="mb-1 text-xs text-slate-400">Each bar is split into every filler/crutch/pause/repetition metric.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    {CATEGORY_COLUMNS.map((c) => (
                      <Bar key={c.key} dataKey={c.label} stackId="a" fill={METRIC_COLORS[c.key]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <FamilyLegend />
            </Card>
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Distribution by Category</p>
              <p className="mb-1 text-xs text-slate-400">Inner ring: category totals. Outer ring: individual metrics.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieParents} dataKey="value" nameKey="name" innerRadius={0} outerRadius={55}>
                      {pieParents.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Pie data={pieChildren} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100}>
                      {pieChildren.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <FamilyLegend />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
