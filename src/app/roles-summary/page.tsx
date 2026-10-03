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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import { Card, Select } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { useMembers } from "@/lib/MembersProvider";
import type { Meeting } from "@/lib/types";
import { ROLE_COLUMNS, WIN_COLUMNS, RADAR_COLUMNS, ROLE_FIELDS, buildTally, type Tally } from "@/lib/roleTally";

// A member is considered to have "attended" a meeting if they filled any role
// in it — the app doesn't track raw attendance, so role participation is the
// best available proxy. Rate is normalized against meetings held since the
// member joined, so a brand-new member isn't penalized for a short history.
const DEFAULT_HIGH_ENGAGEMENT_THRESHOLD = 75;

type EngagementBucket = "Highly Engaged" | "Occasional" | "Not Participating" | "Too New";

const BUCKET_COLORS: Record<EngagementBucket, string> = {
  "Highly Engaged": "#10b981",
  Occasional: "#f59e0b",
  "Not Participating": "#ef4444",
  "Too New": "#94a3b8",
};

interface EngagementRow {
  name: string;
  meetingsEligible: number;
  meetingsAttended: number;
  rate: number;
  rolesTotal: number;
  bucket: EngagementBucket;
}

type EngagementPoint = EngagementRow & { ratePct: number };

function EngagementTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EngagementPoint }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{row.name}</p>
      <p className="mt-0.5" style={{ color: BUCKET_COLORS[row.bucket] }}>
        {row.bucket}
      </p>
      <p className="mt-1 text-slate-500">
        {row.ratePct}% attendance ({row.meetingsAttended}/{row.meetingsEligible} meetings)
      </p>
      <p className="text-slate-500">{row.rolesTotal} roles total</p>
    </div>
  );
}

export default function RolesSummaryPage() {
  const { data: meetings, loading } = useCollection<Meeting>("/api/meetings");
  const { data: roster } = useMembers();
  const [year, setYear] = useState<string>("All");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(DEFAULT_HIGH_ENGAGEMENT_THRESHOLD);

  const years = useMemo(() => {
    const set = new Set(meetings.map((m) => m.date?.slice(0, 4)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [meetings]);

  const filtered = useMemo(
    () => (year === "All" ? meetings : meetings.filter((m) => m.date?.startsWith(year))),
    [meetings, year]
  );

  const tally: Tally = useMemo(() => buildTally(filtered), [filtered]);

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

  // ---- Club-level: member engagement — attendance proxy (took a role) vs opportunity (meetings since joining) ----
  const engagement: EngagementRow[] = useMemo(() => {
    const rosterByName = new Map(roster.map((m) => [m.name, m]));
    const allNames = new Set([...roster.map((m) => m.name), ...members]);

    return Array.from(allNames).map((name) => {
      const joinDate = rosterByName.get(name)?.joinDate || "";
      const eligible = filtered.filter((m) => !joinDate || m.date >= joinDate);
      const attended = eligible.filter((m) => ROLE_FIELDS.some((f) => (m[f] as string) === name));
      const meetingsEligible = eligible.length;
      const meetingsAttended = attended.length;
      const rate = meetingsEligible > 0 ? meetingsAttended / meetingsEligible : 0;
      const rolesTotal = Object.values(tally[name] ?? {}).reduce((a, b) => a + b, 0);

      let bucket: EngagementBucket;
      if (meetingsEligible === 0) bucket = "Too New";
      else if (meetingsAttended === 0) bucket = "Not Participating";
      else if (rate >= threshold / 100) bucket = "Highly Engaged";
      else bucket = "Occasional";

      return { name, meetingsEligible, meetingsAttended, rate, rolesTotal, bucket };
    });
  }, [roster, members, filtered, tally, threshold]);

  const engagementSorted = useMemo(
    () => [...engagement].sort((a, b) => b.rate - a.rate || b.rolesTotal - a.rolesTotal),
    [engagement]
  );

  const engagementPoints: EngagementPoint[] = useMemo(
    () => engagementSorted.map((e) => ({ ...e, ratePct: Math.round(e.rate * 100) })),
    [engagementSorted]
  );

  const engagementBuckets = useMemo(() => {
    const g: Record<EngagementBucket, EngagementRow[]> = {
      "Highly Engaged": [],
      Occasional: [],
      "Not Participating": [],
      "Too New": [],
    };
    engagement.forEach((e) => g[e.bucket].push(e));
    (Object.keys(g) as EngagementBucket[]).forEach((k) => g[k].sort((a, b) => b.rate - a.rate));
    return g;
  }, [engagement]);

  // ---- Individual-level: selected member vs club average ----
  const activeMemberCount = members.length || 1;
  const radarData = useMemo(
    () =>
      RADAR_COLUMNS.map((c) => {
        const clubTotal = members.reduce((sum, name) => sum + (tally[name][c.key] ?? 0), 0);
        return {
          category: c.label,
          member: selectedMember ? tally[selectedMember]?.[c.key] ?? 0 : 0,
          clubAvg: Number((clubTotal / activeMemberCount).toFixed(2)),
        };
      }),
    [tally, members, selectedMember, activeMemberCount]
  );

  const memberOptions = useMemo(() => {
    const names = new Set(roster.map((m) => m.name));
    members.forEach((n) => names.add(n));
    return Array.from(names).sort();
  }, [roster, members]);

  const selectedTotal = selectedMember
    ? Object.values(tally[selectedMember] ?? {}).reduce((a, b) => a + b, 0)
    : 0;

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

      <div className="flex-1 space-y-8 overflow-auto p-6">
        {!loading && members.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">
            No role data yet — fill in the Meeting Tracker and this page updates automatically.
          </Card>
        )}

        {members.length > 0 && (
          <>
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Club Level</p>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

              </div>
            </div>

            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Member Engagement</p>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  Highly engaged threshold
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={threshold}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v)) setThreshold(Math.min(100, Math.max(1, v)));
                    }}
                    className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  />
                  %
                </label>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Took a role in a meeting ≈ attended it (the app doesn&rsquo;t track raw attendance). Rate is normalized against
                meetings held since each member joined{year !== "All" ? `, within ${year}` : ""}.
              </p>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(BUCKET_COLORS) as EngagementBucket[]).map((bucket) => (
                  <div key={bucket} className="group relative">
                    <Card className="p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BUCKET_COLORS[bucket] }} />
                        <p className="text-xs font-semibold text-slate-600">{bucket}</p>
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">{engagementBuckets[bucket].length}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {bucket === "Highly Engaged" && `Attendance rate ≥ ${threshold}%`}
                        {bucket === "Occasional" && `Attendance rate below ${threshold}%, but > 0`}
                        {bucket === "Not Participating" && "Joined, but has never taken a role in range"}
                        {bucket === "Too New" && "No meetings held yet since they joined"}
                      </p>
                    </Card>

                    {engagementBuckets[bucket].length > 0 && (
                      <div
                        className="invisible absolute left-0 top-full z-20 mt-1 w-72 max-w-[90vw] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 opacity-0 shadow-lg transition-opacity duration-100 group-hover:visible group-hover:opacity-100"
                        style={{ maxHeight: "min(60vh, 20rem)" }}
                      >
                        <ul className="space-y-1.5 text-sm text-slate-600">
                          {engagementBuckets[bucket].map((e) => (
                            <li key={e.name} className="flex items-center justify-between gap-3">
                              <span>{e.name}</span>
                              <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                                {e.meetingsAttended}/{e.meetingsEligible}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Card className="p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Attendance Rate vs Roles Taken</p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="ratePct" name="Attendance Rate" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="number" dataKey="rolesTotal" name="Roles Taken" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<EngagementTooltip />} />
                      <Scatter data={engagementPoints}>
                        {engagementPoints.map((e, i) => (
                          <Cell key={i} fill={BUCKET_COLORS[e.bucket]} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  {(Object.keys(BUCKET_COLORS) as EngagementBucket[]).map((bucket) => (
                    <span key={bucket} className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BUCKET_COLORS[bucket] }} />
                      {bucket}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Individual Level — vs Club Average</p>
                <Select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-56">
                  <option value="">Select a member…</option>
                  {memberOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
              <Card className="p-4">
                {!selectedMember ? (
                  <p className="py-16 text-center text-sm text-slate-400">Pick a member above to see their role growth against the club average.</p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{selectedMember}</span> — {selectedTotal} role{selectedTotal === 1 ? "" : "s"} total
                      {year !== "All" ? ` in ${year}` : ""}, vs a club average of {activeMemberCount > 0 ? (RADAR_COLUMNS.reduce((s, c) => s + (radarData.find((r) => r.category === c.label)?.clubAvg ?? 0), 0)).toFixed(1) : 0} roles per active member.
                    </p>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="75%">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Radar name={selectedMember} dataKey="member" stroke="#0f766e" fill="#0f766e" fillOpacity={0.35} />
                          <Radar name="Club Average" dataKey="clubAvg" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeDasharray="4 3" />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </Card>
            </div>

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
