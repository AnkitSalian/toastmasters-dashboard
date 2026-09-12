"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Button, Card, Badge, Input } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { useMembers } from "@/lib/MembersProvider";
import type { Member, MentorAssignment } from "@/lib/types";

const EMPTY: Omit<Member, "id"> = {
  name: "",
  pathways: [],
  membershipActive: true,
  clubRole: "",
  joinDate: "",
  membershipExpiry: "",
  email: "",
  phone: "",
};

function PathwayInput({ pathways, onChange }: { pathways: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !pathways.includes(value)) onChange([...pathways, value]);
    setDraft("");
  }

  return (
    <div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder="Type a pathway and press Enter…"
      />
      {pathways.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pathways.map((p) => (
            <span key={p} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {p}
              <button type="button" onClick={() => onChange(pathways.filter((x) => x !== p))} className="text-slate-400 hover:text-rose-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Member;
  onSubmit: (data: Omit<Member, "id">) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Member, "id">>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Pathway(s)</span>
        <PathwayInput pathways={form.pathways} onChange={(pathways) => setForm({ ...form, pathways })} />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Club-level Role</span>
          <Input
            value={form.clubRole}
            placeholder="e.g. VP Education, Member"
            onChange={(e) => setForm({ ...form, clubRole: e.target.value })}
          />
        </label>
        <label className="flex items-end pb-1.5">
          <span className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.membershipActive}
              onChange={(e) => setForm({ ...form, membershipActive: e.target.checked })}
              className="h-4 w-4 accent-slate-900"
            />
            Membership is active
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Join Date</span>
          <Input type="date" value={form.joinDate ?? ""} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Membership Expiry</span>
          <Input
            type="date"
            value={form.membershipExpiry ?? ""}
            onChange={(e) => setForm({ ...form, membershipExpiry: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
          <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Phone</span>
          <Input type="tel" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Member"}
        </Button>
      </div>
    </form>
  );
}

export default function MembersPage() {
  const { data, loading, addItem, updateItem, removeItem } = useMembers();
  const { data: mentorAssignments } = useCollection<MentorAssignment>("/api/mentor-assignments");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const mentorByName = useMemo(() => {
    const map = new Map<string, string>();
    mentorAssignments.forEach((a) => map.set(a.speakerName.trim().toLowerCase(), a.mentorName));
    return map;
  }, [mentorAssignments]);

  const sorted = useMemo(() => [...data].sort((a, b) => a.name.localeCompare(b.name)), [data]);

  async function handleCreate(payload: Omit<Member, "id">) {
    await addItem(payload);
    setModalOpen(false);
  }

  async function handleUpdate(payload: Omit<Member, "id">) {
    if (!editing) return;
    await updateItem({ ...payload, id: editing.id });
    setEditing(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Members"
        description="Club roster — pathways, membership status, and club-level roles."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add Member
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card className="overflow-hidden">
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Pathway(s)</th>
                  <th className="px-4 py-2.5">Membership</th>
                  <th className="px-4 py-2.5">Club-level Role</th>
                  <th className="px-4 py-2.5">Join Date</th>
                  <th className="px-4 py-2.5">Membership Expiry</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Mentor</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      Loading members…
                    </td>
                  </tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      No members yet. Click &ldquo;Add Member&rdquo; to build the roster.
                    </td>
                  </tr>
                )}
                {sorted.map((m) => {
                  const mentor = mentorByName.get(m.name.trim().toLowerCase());
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{m.name}</td>
                      <td className="px-4 py-2.5">
                        {m.pathways.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {m.pathways.map((p) => (
                              <Badge key={p} className="bg-slate-100 text-slate-600">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={m.membershipActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                          {m.membershipActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{m.clubRole || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{m.joinDate || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{m.membershipExpiry || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{m.email || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{m.phone || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{mentor || "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditing(m)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Edit member"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => removeItem(m.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                            aria-label="Delete member"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Member" wide>
        <MemberForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Member" wide>
        {editing && <MemberForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
