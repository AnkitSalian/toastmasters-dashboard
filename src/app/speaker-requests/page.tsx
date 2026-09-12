"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Button, Card, Badge, Input } from "@/components/ui";
import { NameField } from "@/components/NameField";
import { useCollection } from "@/lib/useCollection";
import type { SpeakerRequest } from "@/lib/types";

const EMPTY: Omit<SpeakerRequest, "id"> = {
  speakerName: "",
  date: "",
  speechDescription: "",
  speechLength: 5,
  status: "Pending",
};

function RequestForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: SpeakerRequest;
  onSubmit: (data: Omit<SpeakerRequest, "id">) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<SpeakerRequest, "id">>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Speaker Name</span>
        <NameField required value={form.speakerName} onChange={(v) => setForm({ ...form, speakerName: v })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
        <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Speech Description</span>
        <Input
          value={form.speechDescription}
          placeholder="e.g. Icebreaker, Level 2 Completion"
          onChange={(e) => setForm({ ...form, speechDescription: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Speech Time Length (minutes)</span>
        <Input
          type="number"
          min={1}
          value={form.speechLength}
          onChange={(e) => setForm({ ...form, speechLength: Number(e.target.value) })}
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Request"}
        </Button>
      </div>
    </form>
  );
}

export default function SpeakerRequestsPage() {
  const { data, loading, addItem, updateItem, removeItem } = useCollection<SpeakerRequest>("/api/speaker-requests");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SpeakerRequest | null>(null);

  const sorted = useMemo(() => [...data].sort((a, b) => (a.date < b.date ? -1 : 1)), [data]);

  async function handleCreate(payload: Omit<SpeakerRequest, "id">) {
    await addItem(payload);
    setModalOpen(false);
  }

  async function handleUpdate(payload: Omit<SpeakerRequest, "id">) {
    if (!editing) return;
    await updateItem({ ...payload, id: editing.id });
    setEditing(null);
  }

  async function handleAssign(req: SpeakerRequest) {
    await updateItem({ ...req, status: req.status === "Assigned" ? "Pending" : "Assigned" });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Speaker Requests"
        description="Track upcoming speech slot requests and assign them to meetings."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add Request
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <th className="px-4 py-2.5">Speaker</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Speech Description</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Loading requests…
                    </td>
                  </tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No speaker requests yet.
                    </td>
                  </tr>
                )}
                {sorted.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.speakerName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.date}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.speechDescription || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.speechLength} min</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={
                          r.status === "Assigned"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(r)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Edit request"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleAssign(r)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                          aria-label="Toggle assigned"
                          title={r.status === "Assigned" ? "Mark pending" : "Mark assigned"}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => removeItem(r.id)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                          aria-label="Delete request"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Speaker Request">
        <RequestForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Speaker Request">
        {editing && <RequestForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
