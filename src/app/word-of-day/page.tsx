"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button, Card, Input } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import type { WordOfDayEntry } from "@/lib/types";

const EMPTY: Omit<WordOfDayEntry, "id"> = {
  meetingDate: "",
  word: "",
  wordMeaning: "",
  idiom: "",
  idiomMeaning: "",
};

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Undated";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function WordOfDayPage() {
  const { data, loading, addItem, removeItem } = useCollection<WordOfDayEntry>("/api/word-of-day");
  const [form, setForm] = useState<Omit<WordOfDayEntry, "id">>(EMPTY);

  const grouped = useMemo(() => {
    const sorted = [...data].sort((a, b) => (a.meetingDate < b.meetingDate ? 1 : -1));
    const map = new Map<string, WordOfDayEntry[]>();
    for (const entry of sorted) {
      const key = monthLabel(entry.meetingDate);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.meetingDate || !form.word) return;
    await addItem(form);
    setForm(EMPTY);
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Word & Idiom of the Day" description="Track weekly words and idioms used at your Toastmasters meetings." />

      <div className="flex-1 space-y-8 overflow-auto p-6">
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Add Entry</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Meeting Date</span>
              <Input
                type="date"
                required
                value={form.meetingDate}
                onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Word of the Day</span>
              <Input
                required
                placeholder="e.g. Serendipity"
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Word Meaning / Example</span>
              <Input
                placeholder="Optional definition or usage example"
                value={form.wordMeaning}
                onChange={(e) => setForm({ ...form, wordMeaning: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Idiom of the Day</span>
              <Input
                placeholder="e.g. Break the ice"
                value={form.idiom}
                onChange={(e) => setForm({ ...form, idiom: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-medium text-slate-600">Idiom Meaning / Example</span>
              <Input
                placeholder="Optional definition or usage example"
                value={form.idiomMeaning}
                onChange={(e) => setForm({ ...form, idiomMeaning: e.target.value })}
              />
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </Card>

        {!loading && grouped.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400">No entries yet — add the first word of the day above.</Card>
        )}

        {grouped.map(([month, entries]) => (
          <div key={month}>
            <p className="mb-3 text-sm font-semibold text-slate-700">{month}</p>
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card key={entry.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                  <div className="text-xs font-medium text-slate-400 sm:w-28 sm:pt-1">{entry.meetingDate}</div>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Word of the Day</p>
                    <p className="font-semibold text-slate-900">{entry.word}</p>
                    {entry.wordMeaning && <p className="text-sm text-slate-500">{entry.wordMeaning}</p>}
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Idiom of the Day</p>
                    <p className="font-semibold text-slate-900">{entry.idiom || "—"}</p>
                    {entry.idiomMeaning && <p className="text-sm text-slate-500">{entry.idiomMeaning}</p>}
                  </div>
                  <button
                    onClick={() => removeItem(entry.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete entry"
                  >
                    <X size={16} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
