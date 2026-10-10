"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Plus, X, Upload } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Button, Card, Badge, Input, Select } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { useMembers } from "@/lib/MembersProvider";
import { PATHWAY_LEVELS, PATHWAY_NAMES, type Member, type MentorAssignment, type LevelCompletion } from "@/lib/types";
import { parseClubMembershipCsv, type ClubMembershipImportRow } from "@/lib/csvImport";
import MemberDetailModal from "./MemberDetailModal";

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
  const [selected, setSelected] = useState("");
  const [customDraft, setCustomDraft] = useState("");
  const showCustom = selected === "__other__";
  const available = PATHWAY_NAMES.filter((p) => !pathways.includes(p));

  function addPathway(value: string) {
    const trimmed = value.trim();
    if (trimmed && !pathways.includes(trimmed)) onChange([...pathways, trimmed]);
    setSelected("");
    setCustomDraft("");
  }

  return (
    <div>
      <Select
        value={selected}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__other__") setSelected(v);
          else addPathway(v);
        }}
      >
        <option value="">Select a pathway…</option>
        {available.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
        <option value="__other__">Other…</option>
      </Select>
      {showCustom && (
        <div className="mt-2 flex gap-2">
          <Input
            autoFocus
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPathway(customDraft);
              }
            }}
            placeholder="Custom pathway name"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => addPathway(customDraft)}>
            Add
          </Button>
        </div>
      )}
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
  const { data: levelCompletions } = useCollection<LevelCompletion>("/api/level-completions");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [importRows, setImportRows] = useState<ClubMembershipImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingNames = useMemo(() => new Set(data.map((m) => m.name.trim().toLowerCase())), [data]);
  const newImportCount = useMemo(
    () => (importRows ?? []).filter((r) => !existingNames.has(r.member.name.trim().toLowerCase())).length,
    [importRows, existingNames]
  );

  const mentorByName = useMemo(() => {
    const map = new Map<string, string>();
    mentorAssignments.forEach((a) => map.set(a.speakerName.trim().toLowerCase(), a.mentorName));
    return map;
  }, [mentorAssignments]);

  // A member can be on several pathways at once, each progressing independently —
  // so "level" is tracked per member per pathway, taking the highest level reached on each.
  const levelByMemberPathway = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const lc of levelCompletions) {
      const key = lc.name.trim().toLowerCase();
      const pathwayMap = map.get(key) ?? new Map<string, string>();
      const existingIdx = PATHWAY_LEVELS.indexOf(pathwayMap.get(lc.pathwayName) as (typeof PATHWAY_LEVELS)[number]);
      const newIdx = PATHWAY_LEVELS.indexOf(lc.level as (typeof PATHWAY_LEVELS)[number]);
      if (newIdx > existingIdx) pathwayMap.set(lc.pathwayName, lc.level);
      map.set(key, pathwayMap);
    }
    return map;
  }, [levelCompletions]);

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

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    setImportRows(parseClubMembershipCsv(text));
  }

  async function handleConfirmImport() {
    if (!importRows) return;
    setImporting(true);
    const toAdd = importRows.filter((r) => !existingNames.has(r.member.name.trim().toLowerCase()));
    await Promise.all(toAdd.map((r) => addItem(r.member)));
    setImporting(false);
    setImportRows(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Members"
        description="Club roster — pathways, membership status, and club-level roles."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} /> Import CSV
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Add Member
            </Button>
          </>
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
                  const pathwayLevels = levelByMemberPathway.get(m.name.trim().toLowerCase());
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium">
                        <button
                          onClick={() => setViewing(m)}
                          className="text-slate-800 underline decoration-slate-300 decoration-dotted underline-offset-4 hover:text-teal-700 hover:decoration-teal-500"
                        >
                          {m.name}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        {m.pathways.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {m.pathways.map((p) => {
                              const level = pathwayLevels?.get(p);
                              return (
                                <Badge key={p} className="bg-slate-100 text-slate-600">
                                  {p}
                                  <span className={level ? "ml-1 font-semibold text-slate-800" : "ml-1 text-slate-400"}>
                                    {level ? `— ${level}` : "— Not started"}
                                  </span>
                                </Badge>
                              );
                            })}
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

      <MemberDetailModal
        member={viewing}
        roster={data}
        mentorAssignments={mentorAssignments}
        onClose={() => setViewing(null)}
      />

      <Modal open={!!importRows} onClose={() => setImportRows(null)} title="Import Club Membership CSV" wide>
        {importRows && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Found {importRows.length} row{importRows.length === 1 ? "" : "s"} — {newImportCount} new,{" "}
              {importRows.length - newImportCount} already in the roster (skipped by name match). Pathway names
              aren&rsquo;t in every export row — add or fix them from the pathway dropdown after import.
            </p>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Join Date</th>
                    <th className="px-3 py-2 text-left">Pathway</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importRows.map((r, i) => {
                    const exists = existingNames.has(r.member.name.trim().toLowerCase());
                    return (
                      <tr key={i} className={exists ? "opacity-50" : ""}>
                        <td className="px-3 py-2 font-medium text-slate-800">{r.member.name}</td>
                        <td className="px-3 py-2 text-slate-600">{r.member.email || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{r.member.clubRole}</td>
                        <td className="px-3 py-2 text-slate-600">{r.member.joinDate || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{r.member.pathways.join(", ") || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge className={exists ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}>
                            {exists ? "Already in roster" : "New"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={() => setImportRows(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmImport} disabled={importing || newImportCount === 0}>
                {importing ? "Importing…" : `Import ${newImportCount} New Member${newImportCount === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
