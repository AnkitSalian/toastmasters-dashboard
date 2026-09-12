"use client";

import { useMemo, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button, Card, Input, Select } from "@/components/ui";
import { NameField } from "@/components/NameField";
import { useCollection } from "@/lib/useCollection";
import { PATHWAY_LEVELS, type LevelCompletion } from "@/lib/types";

const EMPTY: Omit<LevelCompletion, "id"> = {
  name: "",
  level: PATHWAY_LEVELS[0],
  pathwayName: "",
  dateOfCompletion: "",
};

export default function LevelCompletionPage() {
  const { data, loading, addItem, updateItem, removeItem } = useCollection<LevelCompletion>("/api/level-completions");
  const [form, setForm] = useState<Omit<LevelCompletion, "id">>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => (a.dateOfCompletion < b.dateOfCompletion ? 1 : -1)),
    [data]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.pathwayName || !form.dateOfCompletion) return;
    if (editingId) {
      await updateItem({ ...form, id: editingId });
      setEditingId(null);
    } else {
      await addItem(form);
    }
    setForm(EMPTY);
  }

  function handleEdit(item: LevelCompletion) {
    setEditingId(item.id);
    setForm({ name: item.name, level: item.level, pathwayName: item.pathwayName, dateOfCompletion: item.dateOfCompletion });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Level Completion" description="Track pathway level completions across the club." />

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            {editingId ? "Edit Level Completion" : "Add Level Completion"}
          </p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
              <NameField required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Level</span>
              <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {PATHWAY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Pathway Name</span>
              <Input
                required
                value={form.pathwayName}
                onChange={(e) => setForm({ ...form, pathwayName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Date of Completion</span>
              <Input
                type="date"
                required
                value={form.dateOfCompletion}
                onChange={(e) => setForm({ ...form, dateOfCompletion: e.target.value })}
              />
            </label>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit">{editingId ? "Update Record" : "Save Record"}</Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Level</th>
                  <th className="px-4 py-2.5">Pathway Name</th>
                  <th className="px-4 py-2.5">Date of Completion</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No level completions logged yet.
                    </td>
                  </tr>
                )}
                {sorted.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.level}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.pathwayName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{item.dateOfCompletion}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil size={14} />
                        </button>
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
