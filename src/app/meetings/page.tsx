"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Button, Card, Badge } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { MEETING_TYPE_COLORS, MEETING_TYPES, type Meeting, type MeetingType } from "@/lib/types";
import { exportToExcel } from "@/lib/exportExcel";
import MeetingForm from "./MeetingForm";

const EXPORT_FILL: Record<MeetingType, string> = {
  "Regular Club Meeting": "FFF1F5F9",
  Contest: "FFFEF3C7",
  "Education Session": "FFE0F2FE",
  "Open House": "FFD1FAE5",
  "Demo/Kickoff": "FFEDE9FE",
  "Speciality & Themed Meeting": "FFFFE4E6",
};

const COLUMNS: { key: keyof Meeting; header: string }[] = [
  { key: "meetingNumber", header: "Mtg #" },
  { key: "speaker1", header: "Speaker 1" },
  { key: "speaker2", header: "Speaker 2" },
  { key: "speaker3", header: "Speaker 3" },
  { key: "evaluator1", header: "Evaluator 1" },
  { key: "evaluator2", header: "Evaluator 2" },
  { key: "evaluator3", header: "Evaluator 3" },
  { key: "tmodName", header: "TMOD" },
  { key: "tmodTheme", header: "TMOD Theme" },
  { key: "ahCounter", header: "Ah-Counter" },
  { key: "grammarian", header: "Grammarian" },
  { key: "timer", header: "Timer" },
  { key: "tableTopicMaster", header: "Table Topic Master" },
  { key: "generalEvaluator", header: "General Evaluator" },
];

const WINNER_COLUMNS: { key: keyof Meeting; header: string }[] = [
  { key: "bestSpeaker", header: "Best Speaker" },
  { key: "bestEvaluator", header: "Best Evaluator" },
  { key: "bestOfBig3", header: "Best of Big 3" },
  { key: "bestTagPlayer", header: "Best TAG Player" },
];

export default function MeetingsPage() {
  const { data, loading, addItem, updateItem, removeItem } = useCollection<Meeting>("/api/meetings");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const sorted = useMemo(
    () =>
      [...data]
        .filter((m) => typeFilter === "All" || m.meetingType === typeFilter)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data, typeFilter]
  );

  async function handleCreate(payload: Omit<Meeting, "id">) {
    await addItem(payload);
    setModalOpen(false);
  }

  async function handleUpdate(payload: Omit<Meeting, "id">) {
    if (!editing) return;
    await updateItem({ ...payload, id: editing.id });
    setEditing(null);
  }

  async function handleExport() {
    await exportToExcel({
      fileName: "meeting-tracker",
      sheetName: "Meetings",
      rowFill: (row) => EXPORT_FILL[row.meetingType],
      columns: [
        { key: "date", header: "Date", width: 12 },
        { key: "meetingTime", header: "Time", width: 20 },
        { key: "meetingType", header: "Meeting Type", width: 22 },
        ...COLUMNS.map((c) => ({ key: c.key, header: c.header, width: 16 })),
        ...WINNER_COLUMNS.map((c) => ({ key: c.key, header: c.header, width: 20 })),
      ],
      rows: sorted.map((m) => ({
        ...m,
        bestSpeaker: m.bestSpeaker.join(", "),
        bestEvaluator: m.bestEvaluator.join(", "),
        bestOfBig3: m.bestOfBig3.join(", "),
        bestTagPlayer: m.bestTagPlayer.join(", "),
      })),
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Meeting Tracker"
        description="Every club meeting, its roles, and its awards in one log."
        actions={
          <>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
            >
              <option value="All">All meeting types</option>
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={handleExport}>
              <Download size={15} /> Export Excel
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Add Meeting
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
                  <th className="sticky left-0 z-10 bg-slate-900 px-3 py-2.5 whitespace-nowrap">Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Time</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Type</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="px-3 py-2.5 whitespace-nowrap">
                      {c.header}
                    </th>
                  ))}
                  {WINNER_COLUMNS.map((c) => (
                    <th key={c.key} className="px-3 py-2.5 whitespace-nowrap text-amber-300">
                      {c.header}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={COLUMNS.length + WINNER_COLUMNS.length + 4} className="px-3 py-8 text-center text-slate-400">
                      Loading meetings…
                    </td>
                  </tr>
                )}
                {!loading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + WINNER_COLUMNS.length + 4} className="px-3 py-8 text-center text-slate-400">
                      No meetings logged yet. Click “Add Meeting” to start the log.
                    </td>
                  </tr>
                )}
                {sorted.map((m) => {
                  const colors = MEETING_TYPE_COLORS[m.meetingType];
                  return (
                    <tr key={m.id} className={`${colors.bg} border-b border-white/60`}>
                      <td className={`sticky left-0 z-10 whitespace-nowrap px-3 py-2 font-medium ${colors.bg} ${colors.text}`}>
                        {m.date}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">{m.meetingTime}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge className={`${colors.text} bg-white/70`}>
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                          {m.meetingType}
                        </Badge>
                      </td>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {(m[c.key] as string) || <span className="text-slate-400">—</span>}
                        </td>
                      ))}
                      {WINNER_COLUMNS.map((c) => {
                        const names = m[c.key] as string[];
                        return (
                          <td key={c.key} className="whitespace-nowrap px-3 py-2 text-slate-700">
                            {names.length > 0 ? names.join(", ") : <span className="text-slate-400">—</span>}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditing(m)}
                            className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
                            aria-label="Edit meeting"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => removeItem(m.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-rose-600"
                            aria-label="Delete meeting"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Meeting" wide>
        <MeetingForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Meeting" wide>
        {editing && (
          <MeetingForm
            initial={editing}
            submitLabel="Update Meeting"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
