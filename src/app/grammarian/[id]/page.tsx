"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lightbulb, Sparkles, AlertTriangle, Square } from "lucide-react";
import { Button, Card, Input, Select, Badge } from "@/components/ui";
import { NameField } from "@/components/NameField";
import { useCollection } from "@/lib/useCollection";
import type { GrammarianSession, GrammarianSpeaker } from "@/lib/types";

const SPEECH_TYPES = ["Table Topic", "Evaluation", "Speech", "Custom"];

function NextSpeakerForm({ onStart }: { onStart: (speaker: Omit<GrammarianSpeaker, "id">) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const speechType = type === "Custom" ? customType.trim() || "Custom" : type || "Speech";
    onStart({
      speakerName: name.trim(),
      speechType,
      wordUsed: 0,
      idiomUsed: 0,
      goodWords: [],
      expressions: [],
      corrections: [],
      startTime: new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }),
    });
    setName("");
    setType("");
    setCustomType("");
  }

  return (
    <Card className="mx-auto max-w-lg p-6">
      <p className="mb-4 text-sm font-semibold text-slate-700">Next Speaker</p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Speaker Name</span>
          <NameField required value={name} onChange={setName} placeholder="Enter speaker name" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Speech Type</span>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">— optional —</option>
            {SPEECH_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </label>
        {type === "Custom" && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-600">Custom Speech Type</span>
            <Input
              required
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="e.g. Icebreaker, Humorous…"
            />
          </label>
        )}
        <div className="sm:col-span-2">
          <Button type="submit">Start Tracking</Button>
        </div>
      </form>
    </Card>
  );
}

function Tile({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border px-4 py-5 transition-colors ${
        active ? "border-amber-400 bg-amber-500/10 text-amber-300" : "border-white/15 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} />
        <span className="text-lg font-semibold tabular-nums">{count}</span>
      </div>
      <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
    </button>
  );
}

function LiveTracker({
  session,
  speaker,
  onUpdate,
  onEnd,
}: {
  session: GrammarianSession;
  speaker: GrammarianSpeaker;
  onUpdate: (patch: Partial<GrammarianSpeaker>) => void;
  onEnd: () => void;
}) {
  const [activeInput, setActiveInput] = useState<"goodWord" | "expression" | "correction" | null>(null);
  const [value, setValue] = useState("");

  function submitInput() {
    if (!value.trim()) {
      setActiveInput(null);
      return;
    }
    if (activeInput === "goodWord") onUpdate({ goodWords: [...speaker.goodWords, value.trim()] });
    if (activeInput === "expression") onUpdate({ expressions: [...speaker.expressions, value.trim()] });
    if (activeInput === "correction") onUpdate({ corrections: [...speaker.corrections, value.trim()] });
    setValue("");
    setActiveInput(null);
  }

  const placeholders: Record<string, string> = {
    goodWord: "Type the good word…",
    expression: "Type the notable expression…",
    correction: "incorrect usage → correct usage",
  };

  return (
    <div className="rounded-xl bg-slate-900 p-8 text-white">
      <p className="text-center text-sm font-medium uppercase tracking-wide text-white/70">
        {speaker.speakerName} · {speaker.speechType}
      </p>

      {(session.wordOfDay || session.idiomOfDay) && (
        <div className="mt-4 flex justify-center gap-3">
          {session.wordOfDay && (
            <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-white">
              <BookOpen size={12} className="mr-1.5" /> {session.wordOfDay}
            </Badge>
          )}
          {session.idiomOfDay && (
            <Badge className="border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-violet-200">
              <Lightbulb size={12} className="mr-1.5" /> {session.idiomOfDay}
            </Badge>
          )}
        </div>
      )}

      <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3">
        <Tile icon={BookOpen} label="Word Used" count={speaker.wordUsed} onClick={() => onUpdate({ wordUsed: speaker.wordUsed + 1 })} />
        <Tile icon={Lightbulb} label="Idiom Used" count={speaker.idiomUsed} onClick={() => onUpdate({ idiomUsed: speaker.idiomUsed + 1 })} />
        <Tile
          icon={Sparkles}
          label="Good Word"
          count={speaker.goodWords.length}
          active={activeInput === "goodWord"}
          onClick={() => setActiveInput(activeInput === "goodWord" ? null : "goodWord")}
        />
        <Tile
          icon={Sparkles}
          label="Expression"
          count={speaker.expressions.length}
          active={activeInput === "expression"}
          onClick={() => setActiveInput(activeInput === "expression" ? null : "expression")}
        />
      </div>
      <div className="mx-auto mt-3 flex max-w-xl">
        <Tile
          icon={AlertTriangle}
          label="Correction"
          count={speaker.corrections.length}
          active={activeInput === "correction"}
          onClick={() => setActiveInput(activeInput === "correction" ? null : "correction")}
        />
      </div>

      {activeInput && (
        <div className="mx-auto mt-4 flex max-w-xl gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitInput()}
            placeholder={placeholders[activeInput]}
            className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400"
          />
          <button onClick={submitInput} className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-slate-900">
            Add
          </button>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={onEnd}
          className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-5 py-2.5 text-sm font-semibold hover:bg-rose-700"
        >
          <Square size={15} /> End Speaker
        </button>
      </div>
    </div>
  );
}

function SpeakerCard({ speaker }: { speaker: GrammarianSpeaker }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium text-slate-800">{speaker.speakerName}</p>
        <Badge className="bg-slate-100 text-slate-600">{speaker.speechType}</Badge>
      </div>
      <div className="mb-2 flex gap-2 text-xs text-slate-500">
        <span>📘 ×{speaker.wordUsed}</span>
        <span>💡 ×{speaker.idiomUsed}</span>
      </div>
      {speaker.goodWords.length > 0 && (
        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Good Words</p>
          <p className="text-sm text-slate-600">{speaker.goodWords.join(", ")}</p>
        </div>
      )}
      {speaker.expressions.length > 0 && (
        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">Notable Expressions</p>
          <p className="text-sm text-slate-600">{speaker.expressions.join(" · ")}</p>
        </div>
      )}
      {speaker.corrections.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">
            Show Grammar Corrections ({speaker.corrections.length})
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-600">
            {speaker.corrections.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function SessionReport({ session }: { session: GrammarianSession }) {
  const allGood = session.speakers.flatMap((s) => s.goodWords.map((w) => ({ text: w, who: s.speakerName })));
  const allExpr = session.speakers.flatMap((s) => s.expressions.map((w) => ({ text: w, who: s.speakerName })));
  const allCorr = session.speakers.flatMap((s) => s.corrections.map((w) => ({ text: w, who: s.speakerName })));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Speaker</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Word</th>
                <th className="px-4 py-2.5">Idiom</th>
                <th className="px-4 py-2.5">Good Words</th>
                <th className="px-4 py-2.5">Expressions</th>
                <th className="px-4 py-2.5">Corrections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {session.speakers.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.speakerName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.speechType}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.wordUsed}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.idiomUsed}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.goodWords.length}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.expressions.length}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.corrections.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <Sparkles size={14} /> Good Words
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            {allGood.length === 0 && <li className="text-slate-400">None logged</li>}
            {allGood.map((g, i) => (
              <li key={i}>
                {g.text} <span className="text-slate-400">— {g.who}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-violet-700">
            <Sparkles size={14} /> Notable Expressions
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            {allExpr.length === 0 && <li className="text-slate-400">None logged</li>}
            {allExpr.map((g, i) => (
              <li key={i}>
                {g.text} <span className="text-slate-400">— {g.who}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
            <AlertTriangle size={14} /> Grammar Corrections
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            {allCorr.length === 0 && <li className="text-slate-400">None logged</li>}
            {allCorr.map((g, i) => (
              <li key={i}>{g.text}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Speaker Details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {session.speakers.map((s) => (
            <SpeakerCard key={s.id} speaker={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GrammarianSessionPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, updateItem } = useCollection<GrammarianSession>("/api/grammarian-sessions");
  const session = useMemo(() => data.find((s) => s.id === params.id), [data, params.id]);
  const lastSpeaker = session?.speakers[session.speakers.length - 1];
  const isActive = lastSpeaker && !lastSpeaker.endTime;

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading session…</div>;
  if (!session) return <div className="p-6 text-sm text-slate-400">Session not found.</div>;

  function startSpeaker(speaker: Omit<GrammarianSpeaker, "id">) {
    if (!session) return;
    updateItem({ ...session, speakers: [...session.speakers, { ...speaker, id: crypto.randomUUID() }] });
  }

  function updateSpeaker(patch: Partial<GrammarianSpeaker>) {
    if (!session || !lastSpeaker) return;
    updateItem({
      ...session,
      speakers: session.speakers.map((s) => (s.id === lastSpeaker.id ? { ...s, ...patch } : s)),
    });
  }

  function endSpeaker() {
    if (!session || !lastSpeaker) return;
    updateItem({
      ...session,
      speakers: session.speakers.map((s) =>
        s.id === lastSpeaker.id ? { ...s, endTime: new Date().toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }) } : s
      ),
    });
  }

  function endSession() {
    if (!session) return;
    updateItem({ ...session, ended: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/grammarian" className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Session — {new Date(session.createdAt).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <Badge className={session.ended ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}>
              {session.ended ? "Ended" : "Active"}
            </Badge>
          </div>
        </div>
        {!session.ended && (
          <Button variant="secondary" onClick={endSession}>
            End Session
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {session.ended ? (
          <SessionReport session={session} />
        ) : isActive && lastSpeaker ? (
          <LiveTracker session={session} speaker={lastSpeaker} onUpdate={updateSpeaker} onEnd={endSpeaker} />
        ) : (
          <NextSpeakerForm onStart={startSpeaker} />
        )}
      </div>
    </div>
  );
}
