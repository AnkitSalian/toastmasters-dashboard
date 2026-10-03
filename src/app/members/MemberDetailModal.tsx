"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Modal from "@/components/Modal";
import { Card, Badge } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import type { Member, Meeting, MentorAssignment, LevelCompletion, OutsideParticipation } from "@/lib/types";
import { RADAR_COLUMNS, ROLE_COLUMNS, ROLE_FIELD_INFO, AWARD_FIELD_INFO, buildTally } from "@/lib/roleTally";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function MemberDetailModal({
  member,
  roster,
  mentorAssignments,
  onClose,
}: {
  member: Member | null;
  roster: Member[];
  mentorAssignments: MentorAssignment[];
  onClose: () => void;
}) {
  const { data: meetings } = useCollection<Meeting>("/api/meetings");
  const { data: levelCompletions } = useCollection<LevelCompletion>("/api/level-completions");
  const { data: outsideParticipation } = useCollection<OutsideParticipation>("/api/outside-participation");

  const name = member?.name ?? "";

  const tally = useMemo(() => buildTally(meetings), [meetings]);
  const tallyMembers = useMemo(() => Object.keys(tally), [tally]);
  const activeMemberCount = tallyMembers.length || 1;

  const radarData = useMemo(
    () =>
      RADAR_COLUMNS.map((c) => {
        const clubTotal = tallyMembers.reduce((sum, n) => sum + (tally[n][c.key] ?? 0), 0);
        return {
          category: c.label,
          member: tally[name]?.[c.key] ?? 0,
          clubAvg: Number((clubTotal / activeMemberCount).toFixed(2)),
        };
      }),
    [tally, tallyMembers, name, activeMemberCount]
  );

  const history = useMemo(() => {
    if (!name) return [];
    return meetings
      .map((m) => {
        const roles = Array.from(
          new Set(ROLE_FIELD_INFO.filter((info) => (m[info.key] as string)?.trim() === name).map((info) => info.label))
        );
        const awards = AWARD_FIELD_INFO.filter((info) => (m[info.key] as string[]).includes(name)).map(
          (info) => info.label
        );
        return { date: m.date, meetingType: m.meetingType, roles, awards };
      })
      .filter((row) => row.roles.length > 0 || row.awards.length > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [meetings, name]);

  const rolesByLabel = useMemo(() => {
    if (!name) return [];
    const map = new Map<string, string[]>();
    for (const m of meetings) {
      const labels = new Set(
        ROLE_FIELD_INFO.filter((info) => (m[info.key] as string)?.trim() === name).map((info) => info.label)
      );
      labels.forEach((label) => map.set(label, [...(map.get(label) ?? []), m.date]));
    }
    return ROLE_COLUMNS.map((c) => ({
      label: c.label,
      dates: (map.get(c.label) ?? []).sort((a, b) => (a < b ? 1 : -1)),
    }));
  }, [meetings, name]);

  const awardsByLabel = useMemo(() => {
    if (!name) return [];
    const map = new Map<string, string[]>();
    for (const m of meetings) {
      AWARD_FIELD_INFO.filter((info) => (m[info.key] as string[]).includes(name)).forEach((info) =>
        map.set(info.label, [...(map.get(info.label) ?? []), m.date])
      );
    }
    return AWARD_FIELD_INFO.map((info) => ({
      label: info.label,
      dates: (map.get(info.label) ?? []).sort((a, b) => (a < b ? 1 : -1)),
    }));
  }, [meetings, name]);

  const meetingsEligible = useMemo(() => {
    if (!member?.joinDate) return meetings.length;
    return meetings.filter((m) => m.date >= member.joinDate!).length;
  }, [meetings, member]);

  const rolesTotal = useMemo(() => Object.values(tally[name] ?? {}).reduce((a, b) => a + b, 0), [tally, name]);
  const rate = meetingsEligible > 0 ? Math.round((history.length / meetingsEligible) * 100) : 0;

  const mentor = useMemo(
    () => mentorAssignments.find((a) => a.speakerName.trim().toLowerCase() === name.trim().toLowerCase())?.mentorName,
    [mentorAssignments, name]
  );
  const mentees = useMemo(
    () => mentorAssignments.filter((a) => a.mentorName.trim().toLowerCase() === name.trim().toLowerCase()),
    [mentorAssignments, name]
  );

  const myLevelCompletions = useMemo(
    () =>
      levelCompletions
        .filter((l) => l.name.trim().toLowerCase() === name.trim().toLowerCase())
        .sort((a, b) => (a.dateOfCompletion < b.dateOfCompletion ? 1 : -1)),
    [levelCompletions, name]
  );

  const myOutsideParticipation = useMemo(
    () =>
      outsideParticipation
        .filter((o) => o.name.trim().toLowerCase() === name.trim().toLowerCase())
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [outsideParticipation, name]
  );

  void roster;

  return (
    <Modal open={!!member} onClose={onClose} title={member ? member.name : ""} wide>
      {member && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Meetings Attended" value={history.length} />
            <StatCard label="Total Roles Taken" value={rolesTotal} />
            <StatCard label="Attendance Rate" value={`${rate}%`} />
            <StatCard label="Member Since" value={member.joinDate || "—"} />
          </div>

          {myLevelCompletions.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Pathway Progress</p>
              <div className="flex flex-wrap gap-1.5">
                {myLevelCompletions.map((l) => (
                  <Badge key={l.id} className="bg-sky-100 text-sky-700">
                    {l.pathwayName} — {l.level} ({l.dateOfCompletion})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {myOutsideParticipation.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Outside Club Participation</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {myOutsideParticipation.map((o) => (
                  <li key={o.id}>
                    {o.date} — {o.role} at {o.clubName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Role Growth vs Club Average</p>
            <Card className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Radar name={member.name} dataKey="member" stroke="#0f766e" fill="#0f766e" fillOpacity={0.35} />
                    <Radar name="Club Average" dataKey="clubAvg" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeDasharray="4 3" />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Roles Taken, by Type</p>
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {rolesByLabel.map((r) => (
                <div key={r.label}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700">{r.label}</p>
                    <Badge className={r.dates.length > 0 ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"}>
                      {r.dates.length}
                    </Badge>
                  </div>
                  {r.dates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {r.dates.map((d) => (
                        <span key={d} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Not yet taken.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Awards Won, by Type</p>
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              {awardsByLabel.map((a) => (
                <div key={a.label}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <p className={`text-sm font-semibold ${a.dates.length > 0 ? "text-amber-700" : "text-slate-700"}`}>
                      {a.label}
                    </p>
                    <Badge className={a.dates.length > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-400"}>
                      {a.dates.length}
                    </Badge>
                  </div>
                  {a.dates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {a.dates.map((d) => (
                        <span key={d} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Not yet won.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Mentorship</p>
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="mb-1.5 text-sm font-semibold text-slate-700">Mentor</p>
                {mentor ? (
                  <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{mentor}</span>
                ) : (
                  <p className="text-xs text-slate-400">No mentor assigned yet.</p>
                )}
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700">Mentees</p>
                  <Badge className={mentees.length > 0 ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"}>
                    {mentees.length}
                  </Badge>
                </div>
                {mentees.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {mentees.map((m) => (
                      <span key={m.id} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        {m.speakerName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Not mentoring anyone yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
