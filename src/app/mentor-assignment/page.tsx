"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button, Card } from "@/components/ui";
import { NameField } from "@/components/NameField";
import { useCollection } from "@/lib/useCollection";
import type { MentorAssignment } from "@/lib/types";

export default function MentorAssignmentPage() {
  const { data, loading, addItem, removeItem } = useCollection<MentorAssignment>("/api/mentor-assignments");
  const [speakerName, setSpeakerName] = useState("");
  const [mentorName, setMentorName] = useState("");

  const mentorMentees = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of data) {
      if (!a.mentorName.trim() || !a.speakerName.trim()) continue;
      map.set(a.mentorName, [...(map.get(a.mentorName) ?? []), a.speakerName]);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!speakerName || !mentorName) return;
    await addItem({ speakerName, mentorName });
    setSpeakerName("");
    setMentorName("");
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Mentor Assignment" description="Pair speakers with mentors and see mentee load at a glance." />

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Add New Assignment</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Speaker Name</span>
              <NameField required value={speakerName} onChange={setSpeakerName} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Mentor Name</span>
              <NameField required value={mentorName} onChange={setMentorName} />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Add Assignment</Button>
            </div>
          </form>
        </Card>

        {mentorMentees.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Mentee Count by Mentor</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mentorMentees.map(([mentor, mentees]) => (
                <div key={mentor} className="group relative">
                  <Card className="p-4">
                    <p className="truncate text-sm font-medium text-slate-700">{mentor}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{mentees.length}</p>
                    <p className="text-xs text-slate-400">{mentees.length === 1 ? "mentee" : "mentees"}</p>
                  </Card>

                  <div
                    className="invisible absolute left-0 top-full z-20 mt-1 w-64 max-w-[90vw] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 opacity-0 shadow-lg transition-opacity duration-100 group-hover:visible group-hover:opacity-100"
                    style={{ maxHeight: "min(60vh, 20rem)" }}
                  >
                    <ul className="space-y-1 text-sm text-slate-600">
                      {mentees.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Speaker</th>
                  <th className="px-4 py-2.5">Mentor</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No mentor assignments yet.
                    </td>
                  </tr>
                )}
                {data.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{item.speakerName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.mentorName}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
