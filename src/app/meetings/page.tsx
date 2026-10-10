"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Plus, Download, Upload, FileDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Button, Card, Badge } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import { MEETING_TYPE_COLORS, type Meeting, type MeetingType, MEETING_TYPES } from "@/lib/types";
import { exportToExcel } from "@/lib/exportExcel";
import { MEETING_COLUMNS as COLUMNS, MEETING_WINNER_COLUMNS as WINNER_COLUMNS } from "@/lib/meetingColumns";
import { downloadMeetingTemplate, parseMeetingsExcel, type MeetingImportRow } from "@/lib/meetingImport";
import MeetingForm from "./MeetingForm";

const EXPORT_FILL: Record<MeetingType, string> = {
  "Regular Club Meeting": "FFF1F5F9",
  Contest: "FFFEF3C7",
  "Education Session": "FFE0F2FE",
  "Open House": "FFD1FAE5",
  "Demo/Kickoff": "FFEDE9FE",
  "Speciality & Themed Meeting": "FFFFE4E6",
};

export default function MeetingsPage() {
  const { data, loading, addItem, updateItem, removeItem } = useCollection<Meeting>("/api/meetings");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [importChooserOpen, setImportChooserOpen] = useState(false);
  const [importRows, setImportRows] = useState<MeetingImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingDateTimeKeys = useMemo(
    () => new Set(data.map((m) => `${m.date}|${m.meetingTime}`)),
    [data]
  );
  const newImportCount = useMemo(
    () => (importRows ?? []).filter((r) => !existingDateTimeKeys.has(`${r.meeting.date}|${r.meeting.meetingTime}`)).length,
    [importRows, existingDateTimeKeys]
  );

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

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const rows = await parseMeetingsExcel(file);
    setImportChooserOpen(false);
    setImportRows(rows);
  }

  async function handleConfirmImport() {
    if (!importRows) return;
    setImporting(true);
    const toAdd = importRows.filter((r) => !existingDateTimeKeys.has(`${r.meeting.date}|${r.meeting.meetingTime}`));
    await Promise.all(toAdd.map((r) => addItem(r.meeting)));
    setImporting(false);
    setImportRows(null);
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
            <Button variant="secondary" onClick={() => setImportChooserOpen(true)}>
              <Upload size={15} /> Import
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

      <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileSelected} className="hidden" />

      <Modal open={importChooserOpen} onClose={() => setImportChooserOpen(false)} title="Import Meetings">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-800">Don&rsquo;t have a file yet?</p>
            <p className="mt-1 text-sm text-slate-500">
              Download a blank template with the right column headers, fill it in, then come back here to upload it.
            </p>
            <Button variant="secondary" className="mt-3" onClick={() => downloadMeetingTemplate()}>
              <FileDown size={15} /> Download Template
            </Button>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-medium text-slate-800">Already have a filled-in file?</p>
            <p className="mt-1 text-sm text-slate-500">Upload your .xlsx and review what will be added before it&rsquo;s saved.</p>
            <Button className="mt-3" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} /> Upload Filled File
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!importRows} onClose={() => setImportRows(null)} title="Import Preview" wide>
        {importRows && (
          <div className="space-y-4">
            {importRows.length === 0 ? (
              <p className="text-sm text-slate-500">No rows with a date were found in that file.</p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Found {importRows.length} row{importRows.length === 1 ? "" : "s"} — {newImportCount} new,{" "}
                  {importRows.length - newImportCount} already logged (same date &amp; time, skipped).
                </p>
                <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-900 text-xs font-semibold uppercase tracking-wide text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Speaker 1</th>
                        <th className="px-3 py-2 text-left">TMOD</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importRows.map((r, i) => {
                        const exists = existingDateTimeKeys.has(`${r.meeting.date}|${r.meeting.meetingTime}`);
                        return (
                          <tr key={i} className={exists ? "opacity-50" : ""}>
                            <td className="px-3 py-2 font-medium text-slate-800">{r.meeting.date}</td>
                            <td className="px-3 py-2 text-slate-600">{r.meeting.meetingTime || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">
                              {r.meeting.meetingType}
                              {r.typeDefaulted && (
                                <span className="ml-1 text-xs text-amber-600" title="Meeting Type cell didn't match a known type; defaulted.">
                                  (defaulted)
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{r.meeting.speaker1 || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{r.meeting.tmodName || "—"}</td>
                            <td className="px-3 py-2">
                              <Badge className={exists ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}>
                                {exists ? "Already logged" : "New"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={() => setImportRows(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmImport} disabled={importing || newImportCount === 0}>
                {importing ? "Importing…" : `Import ${newImportCount} New Meeting${newImportCount === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
