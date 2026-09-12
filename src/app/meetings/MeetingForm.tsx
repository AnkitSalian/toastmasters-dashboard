"use client";

import { useState } from "react";
import { Input, Select, Button } from "@/components/ui";
import { NameField, NameMultiField } from "@/components/NameField";
import { MEETING_TYPES, type Meeting } from "@/lib/types";

const EMPTY: Omit<Meeting, "id"> = {
  date: "",
  meetingType: "Regular Club Meeting",
  meetingNumber: "",
  speaker1: "",
  speaker2: "",
  speaker3: "",
  evaluator1: "",
  evaluator2: "",
  evaluator3: "",
  tmodName: "",
  tmodTheme: "",
  ahCounter: "",
  grammarian: "",
  timer: "",
  tableTopicMaster: "",
  generalEvaluator: "",
  bestSpeaker: [],
  bestEvaluator: [],
  bestOfBig3: [],
  bestTagPlayer: [],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export default function MeetingForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Meeting",
}: {
  initial?: Meeting;
  onSubmit: (data: Omit<Meeting, "id">) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<Omit<Meeting, "id">>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Meeting>(key: K, value: Meeting[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Meeting Details">
        <Field label="Date">
          <Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Meeting Type">
          <Select value={form.meetingType} onChange={(e) => set("meetingType", e.target.value as Meeting["meetingType"])}>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Meeting Number">
          <Input value={form.meetingNumber} onChange={(e) => set("meetingNumber", e.target.value)} />
        </Field>
      </Section>

      <Section title="Speakers">
        <Field label="Speaker 1">
          <NameField value={form.speaker1} onChange={(v) => set("speaker1", v)} />
        </Field>
        <Field label="Speaker 2">
          <NameField value={form.speaker2} onChange={(v) => set("speaker2", v)} />
        </Field>
        <Field label="Speaker 3">
          <NameField value={form.speaker3} onChange={(v) => set("speaker3", v)} />
        </Field>
      </Section>

      <Section title="Evaluators">
        <Field label="Evaluator 1">
          <NameField value={form.evaluator1} onChange={(v) => set("evaluator1", v)} />
        </Field>
        <Field label="Evaluator 2">
          <NameField value={form.evaluator2} onChange={(v) => set("evaluator2", v)} />
        </Field>
        <Field label="Evaluator 3">
          <NameField value={form.evaluator3} onChange={(v) => set("evaluator3", v)} />
        </Field>
      </Section>

      <Section title="Meeting Roles">
        <Field label="TMOD Name">
          <NameField value={form.tmodName} onChange={(v) => set("tmodName", v)} />
        </Field>
        <Field label="TMOD Theme">
          <Input value={form.tmodTheme} onChange={(e) => set("tmodTheme", e.target.value)} />
        </Field>
        <Field label="Table Topic Master">
          <NameField value={form.tableTopicMaster} onChange={(v) => set("tableTopicMaster", v)} />
        </Field>
        <Field label="Ah-Counter">
          <NameField value={form.ahCounter} onChange={(v) => set("ahCounter", v)} />
        </Field>
        <Field label="Grammarian">
          <NameField value={form.grammarian} onChange={(v) => set("grammarian", v)} />
        </Field>
        <Field label="Timer">
          <NameField value={form.timer} onChange={(v) => set("timer", v)} />
        </Field>
        <Field label="General Evaluator">
          <NameField value={form.generalEvaluator} onChange={(v) => set("generalEvaluator", v)} />
        </Field>
      </Section>

      <Section title="Awards">
        <Field label="Best Speaker">
          <NameMultiField values={form.bestSpeaker} onChange={(v) => set("bestSpeaker", v)} />
        </Field>
        <Field label="Best Evaluator">
          <NameMultiField values={form.bestEvaluator} onChange={(v) => set("bestEvaluator", v)} />
        </Field>
        <Field label="Best of Big 3">
          <NameMultiField values={form.bestOfBig3} onChange={(v) => set("bestOfBig3", v)} />
        </Field>
        <Field label="Best TAG Player">
          <NameMultiField values={form.bestTagPlayer} onChange={(v) => set("bestTagPlayer", v)} />
        </Field>
      </Section>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
