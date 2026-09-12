"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import { Card, Select } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import type { Meeting } from "@/lib/types";

const ROLE_COLUMNS: { key: keyof Meeting | "speaker" | "evaluator"; label: string }[] = [
  { key: "speaker", label: "Speaker" },
  { key: "evaluator", label: "Evaluator" },
  { key: "tmodName", label: "TMOD" },
  { key: "tableTopicMaster", label: "TT Master" },
  { key: "generalEvaluator", label: "Gen. Evaluator" },
  { key: "timer", label: "Timer" },
  { key: "ahCounter", label: "Ah-Counter" },
  { key: "grammarian", label: "Grammarian" },
];

const WIN_COLUMNS: { key: keyof Meeting; label: string }[] = [
  { key: "bestSpeaker", label: "Win: Speaker" },
  { key: "bestEvaluator", label: "Win: Evaluator" },
  { key: "bestOfBig3", label: "Win: Big 3" },
  { key: "bestTagPlayer", label: "Win: TAG" },
];

type Tally = Record<string, Record<string, number>>;

function addTally(tally: Tally, member: string, column: string) {
  if (!member.trim() || member.trim().toUpperCase() === "NA") return;
  const name = member.trim();
  tally[name] ??= {};
  tally[name][column] = (tally[name][column] ?? 0) + 1;
}

export default function RolesSummaryPage() {
  const { data: meetings, loading } = useCollection<Meeting>("/api/meetings");
  const [year, setYear] = useState<string>("All");

  const years = useMemo(() => {
    const set = new Set(meetings.map((m) => m.date?.slice(0, 4)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [meetings]);

  const filtered = useMemo(
    () => (year === "All" ? meetings : meetings.filter((m) => m.date?.startsWith(year))),
    [meetings, year]
  );

  const tally: Tally = useMemo(() => {
    const t: Tally = {};
    for (const m of filtered) {
      addTally(t, m.speaker1, "speaker");
      addTally(t, m.speaker2, "speaker");
      addTally(t, m.speaker3, "speaker");
      addTally(t, m.evaluator1, "evaluator");
      addTally(t, m.evaluator2, "evaluator");
      addTally(t, m.evaluator3, "evaluator");
      addTally(t, m.tmodName, "tmodName");
      addTally(t, m.tableTopicMaster, "tableTopicMaster");
      addTally(t, m.generalEvaluator, "generalEvaluator");
      addTally(t, m.timer, "timer");
      addTally(t, m.ahCounter, "ahCounter");
      addTally(t, m.grammarian, "grammarian");
      m.bestSpeaker.forEach((name) => addTally(t, name, "bestSpeaker"));
      m.bestEvaluator.forEach((name) => addTally(t, name, "bestEvaluator"));
      m.bestOfBig3.forEach((name) => addTally(t, name, "bestOfBig3"));
      m.bestTagPlayer.forEach((name) => addTally(t, name, "bestTagPlayer"));
    }
    return t;
  }, [filtered]);

  const members = useMemo(() => Object.keys(tally).sort(), [tally]);

  const chartData = useMemo(
    () =>
      members
        .map((name) => {
          const roles = tally[name];
          const total = Object.values(roles).reduce((a, b) => a + b, 0);
          return { name, total, ...roles };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
    [members, tally]
  );

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Roles Summary"
        description="Auto-tallied from the Meeting Tracker: who has done which role, and how often."
        actions={
          <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-40">
            <option value="All">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        }
      />

      <div className="flex-1 space-y-6 overflow-auto p-6">
        {!loading && members.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">
            No role data yet — fill in the Meeting Tracker and this page updates automatically.
          </Card>
        )}

        {members.length > 0 && (
          <>
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Top 10 Most Active Members</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="speaker" stackId="a" name="Speaker" fill="#0f766e" />
                    <Bar dataKey="evaluator" stackId="a" name="Evaluator" fill="#f59e0b" />
                    <Bar dataKey="tmodName" stackId="a" name="TMOD" fill="#6366f1" />
                    <Bar dataKey="tableTopicMaster" stackId="a" name="TT Master" fill="#ec4899" />
                    <Bar dataKey="generalEvaluator" stackId="a" name="Gen. Evaluator" fill="#14b8a6" />
                    <Bar dataKey="timer" stackId="a" name="Timer" fill="#a855f7" />
                    <Bar dataKey="ahCounter" stackId="a" name="Ah-Counter" fill="#f97316" />
                    <Bar dataKey="grammarian" stackId="a" name="Grammarian" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="table-scroll overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-900 px-3 py-2.5">Member</th>
                      {ROLE_COLUMNS.map((c) => (
                        <th key={c.key} className="px-3 py-2.5 text-center">
                          {c.label}
                        </th>
                      ))}
                      {WIN_COLUMNS.map((c) => (
                        <th key={c.key} className="px-3 py-2.5 text-center text-amber-300">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((name, idx) => (
                      <tr key={name} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-medium text-slate-800">{name}</td>
                        {ROLE_COLUMNS.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-center text-slate-600">
                            {tally[name][c.key] ?? "—"}
                          </td>
                        ))}
                        {WIN_COLUMNS.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-center font-medium text-amber-600">
                            {tally[name][c.key] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
