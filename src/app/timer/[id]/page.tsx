"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NameField } from "@/components/NameField";
import { useCollection } from "@/lib/useCollection";
import type { TimerSession, TimerSpeaker } from "@/lib/types";
import {
  SPEECH_TYPES,
  formatTime,
  getPhase,
  getStatus,
  PHASE_META,
  PHASE_BG,
  STATUS_META,
  STATUS_BADGE,
  WORD_IDIOM_CYCLE_SECONDS,
} from "@/lib/time";

function SetupScreen({ onBegin }: { onBegin: (word: string, idiom: string) => void }) {
  const [word, setWord] = useState("");
  const [idiom, setIdiom] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onBegin(word.trim(), idiom.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber-400 uppercase">Step 1 of 2</p>
      <h2 className="mt-1 mb-1.5 text-2xl font-semibold text-white">Set up the session</h2>
      <p className="mb-6 text-sm text-slate-400">
        The word and idiom of the day stay locked for every speaker in this session, alternating on screen every{" "}
        {WORD_IDIOM_CYCLE_SECONDS}s while timing.
      </p>
      <label className="mb-5 block">
        <span className="mb-2 block text-xs font-bold tracking-wide text-slate-400 uppercase">Word of the Day</span>
        <input
          required
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. Serendipity"
          className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
        />
      </label>
      <label className="mb-6 block">
        <span className="mb-2 block text-xs font-bold tracking-wide text-slate-400 uppercase">Idiom of the Day</span>
        <input
          required
          value={idiom}
          onChange={(e) => setIdiom(e.target.value)}
          placeholder="e.g. Break the ice"
          className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
        />
      </label>
      <button type="submit" className="rounded-lg bg-amber-400 px-7 py-3.5 text-sm font-bold text-[#201200] shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30">
        Begin Session
      </button>
    </form>
  );
}

function AddSpeakerForm({ onAdd }: { onAdd: (speaker: Omit<TimerSpeaker, "id">) => void }) {
  const [name, setName] = useState("");
  const [typeKey, setTypeKey] = useState<keyof typeof SPEECH_TYPES>("speech");
  const [showTime, setShowTime] = useState(true);
  const [customGreenMin, setCustomGreenMin] = useState(5);
  const [customYellowMin, setCustomYellowMin] = useState(6);
  const [customRedMin, setCustomRedMin] = useState(7);

  const type = SPEECH_TYPES[typeKey];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const thresholds =
      typeKey === "custom"
        ? { green: Math.round(customGreenMin * 60), yellow: Math.round(customYellowMin * 60), red: Math.round(customRedMin * 60) }
        : { green: type.green, yellow: type.yellow, red: type.red };
    onAdd({
      speakerName: name.trim(),
      speechTypeKey: typeKey,
      speechTypeLabel: type.shortLabel,
      hasGraceBefore: type.hasGraceBefore,
      hasGraceAfter: type.hasGraceAfter,
      ...thresholds,
      showTime,
    });
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="mb-7 rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">Add Speaker</h3>
      <div className="grid grid-cols-1 items-end gap-3.5 sm:grid-cols-[1.3fr_1.3fr_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-bold tracking-wide text-slate-400 uppercase">Speaker Name</span>
          <NameField
            value={name}
            onChange={setName}
            placeholder="e.g. Priya Nair"
            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold tracking-wide text-slate-400 uppercase">Speech Type</span>
          <select
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value as keyof typeof SPEECH_TYPES)}
            className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          >
            {Object.values(SPEECH_TYPES).map((t) => (
              <option key={t.key} value={t.key}>
                {t.shortLabel}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-bold text-[#201200] hover:bg-amber-300"
        >
          Add
        </button>

        {typeKey === "custom" && (
          <div className="flex gap-2.5 sm:col-span-3">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-400 uppercase">Green (min)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={customGreenMin}
                onChange={(e) => setCustomGreenMin(Number(e.target.value))}
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-400 uppercase">Yellow (min)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={customYellowMin}
                onChange={(e) => setCustomYellowMin(Number(e.target.value))}
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-400 uppercase">Red (min)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={customRedMin}
                onChange={(e) => setCustomRedMin(Number(e.target.value))}
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
          </div>
        )}

        <label className="flex min-h-11 items-center gap-2.5 text-sm text-white sm:col-span-3">
          <input
            type="checkbox"
            checked={showTime}
            onChange={(e) => setShowTime(e.target.checked)}
            className="h-5 w-5 accent-amber-400"
          />
          Show the time on screen during timing
        </label>
      </div>
    </form>
  );
}

function RosterScreen({
  session,
  onAddSpeaker,
  onStartTiming,
  onFinish,
}: {
  session: TimerSession;
  onAddSpeaker: (s: Omit<TimerSpeaker, "id">) => void;
  onStartTiming: (id: string) => void;
  onFinish: () => void;
}) {
  const completedCount = session.speakers.filter((s) => s.status).length;

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Session in progress</h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="flex items-baseline gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white">
            <span className="font-mono text-[10px] tracking-wide text-amber-400 uppercase">Word</span>
            {session.wordOfDay}
          </span>
          <span className="flex items-baseline gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white">
            <span className="font-mono text-[10px] tracking-wide text-amber-400 uppercase">Idiom</span>
            {session.idiomOfDay}
          </span>
        </div>
      </div>

      <AddSpeakerForm onAdd={onAddSpeaker} />

      {session.speakers.length === 0 ? (
        <div className="mb-7 rounded-xl border border-dashed border-slate-700 py-6 text-center text-sm text-slate-400">
          No speakers added yet. Add one above to begin timing.
        </div>
      ) : (
        <div className="mb-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {session.speakers.map((sp) => {
            const status = sp.status ? STATUS_META[sp.status] : null;
            return (
              <div key={sp.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                <p className="text-lg font-semibold text-white">{sp.speakerName}</p>
                <p className="mb-3.5 text-xs text-slate-400">{sp.speechTypeLabel}</p>
                <div className="flex items-center justify-between gap-2">
                  {sp.status ? (
                    <>
                      <span className="font-mono text-sm text-white">{formatTime(sp.elapsedSeconds ?? 0)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${STATUS_BADGE[sp.status]}`}>
                        {status?.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-300 uppercase">
                        Not timed
                      </span>
                      <button
                        onClick={() => onStartTiming(sp.id)}
                        className="rounded-md bg-amber-400 px-4 py-2 text-xs font-bold text-[#201200] hover:bg-amber-300"
                      >
                        Start Timing
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onFinish}
          disabled={completedCount === 0}
          className="min-h-11 rounded-lg border border-slate-700 bg-transparent px-6 py-3 text-sm font-bold text-white hover:border-amber-400 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {`Finish Session & View Report (${completedCount} timed)`}
        </button>
      </div>
    </div>
  );
}

const EMOJI_POP_MS = 2000;

function FullscreenTimer({
  session,
  speaker,
  onEnd,
}: {
  session: TimerSession;
  speaker: TimerSpeaker;
  onEnd: (result: { elapsedSeconds: number; status: TimerSpeaker["status"] }) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [wordCount, setWordCount] = useState(0);
  const [idiomCount, setIdiomCount] = useState(0);
  const [popEmoji, setPopEmoji] = useState<{ emoji: string; key: number } | null>(null);
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popKeyRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => {
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    };
  }, []);

  function pop(emoji: string) {
    popKeyRef.current += 1;
    setPopEmoji({ emoji, key: popKeyRef.current });
    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    popTimeoutRef.current = setTimeout(() => setPopEmoji(null), EMOJI_POP_MS);
  }

  function finish() {
    const status = getStatus(elapsedRef.current, speaker, speaker);
    onEnd({ elapsedSeconds: elapsedRef.current, status });
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phase = getPhase(elapsed, speaker, speaker);
  const cycleIndex = Math.floor(elapsed / WORD_IDIOM_CYCLE_SECONDS);
  const showingWord = cycleIndex % 2 === 0;
  const cycleLabel = showingWord ? "Word of the Day" : "Idiom of the Day";
  const cycleValue = showingWord ? session.wordOfDay : session.idiomOfDay;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-[#fdfaf4] transition-colors duration-700 ${PHASE_BG[phase]}`}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 sm:p-8">
        <div className="text-sm">
          <strong>{speaker.speakerName}</strong>
          <span className="ml-2 opacity-75">{speaker.speechTypeLabel}</span>
        </div>
        <div className="rounded-full border border-white/25 bg-black/30 px-3.5 py-1.5 font-mono text-[11px] tracking-wider">
          {PHASE_META[phase].badge}
        </div>
      </div>

      {popEmoji && (
        <div key={popEmoji.key} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="animate-emoji-pop text-8xl sm:text-9xl">{popEmoji.emoji}</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div key={cycleIndex}>
          <div className="mb-1.5 font-mono text-[11px] tracking-[0.3em] uppercase opacity-70">{cycleLabel}</div>
          <div className="max-w-4xl text-4xl font-semibold italic sm:text-6xl">{cycleValue}</div>
        </div>

        {speaker.showTime && <div className="font-mono text-5xl font-semibold tabular-nums sm:text-7xl">{formatTime(elapsed)}</div>}

        <div className="mt-2 flex gap-4">
          <button
            onClick={() => {
              setWordCount((c) => c + 1);
              pop("📘");
            }}
            className="flex items-center gap-2.5 rounded-full border border-white/30 bg-black/25 px-5 py-3 text-sm font-semibold hover:bg-black/40"
          >
            📘 Word of the Day <span className="font-mono text-base tabular-nums">{wordCount}</span>
          </button>
          <button
            onClick={() => {
              setIdiomCount((c) => c + 1);
              pop("💡");
            }}
            className="flex items-center gap-2.5 rounded-full border border-white/30 bg-black/25 px-5 py-3 text-sm font-semibold hover:bg-black/40"
          >
            💡 Idiom of the Day <span className="font-mono text-base tabular-nums">{idiomCount}</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-7 left-8 font-mono text-xs opacity-55">Press Esc or use End &amp; Save to stop</div>
      <div className="absolute right-8 bottom-7">
        <button
          onClick={finish}
          className="min-h-11 rounded-lg border border-white/35 bg-black/35 px-5 py-3 text-sm font-bold hover:bg-black/55"
        >
          End &amp; Save
        </button>
      </div>
    </div>
  );
}

function ReportScreen({ session }: { session: TimerSession }) {
  const timed = session.speakers.filter((s) => s.status);
  const maxSeconds = Math.max(...timed.map((s) => s.elapsedSeconds ?? 0), 60);
  const barColor: Record<string, string> = {
    under: "#d19a1f",
    qualified: "#1c8a4c",
    over: "#d19a1f",
    disqualified: "#c23a2c",
  };

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber-400 uppercase">Session Complete</p>
      <h2 className="mt-1 mb-1.5 text-2xl font-semibold text-white">Final Report</h2>
      <p className="mb-6 text-sm text-slate-400">
        Word: &ldquo;{session.wordOfDay}&rdquo; · Idiom: &ldquo;{session.idiomOfDay}&rdquo;
      </p>

      <div className="mb-8 overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-slate-400 uppercase">
              <th className="px-4 py-3">Speaker</th>
              <th className="px-4 py-3">Speech Type</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {timed.map((sp) => {
              const status = STATUS_META[sp.status!];
              return (
                <tr key={sp.id} className="border-t border-slate-700 text-white">
                  <td className="px-4 py-3">{sp.speakerName}</td>
                  <td className="px-4 py-3 text-slate-300">{sp.speechTypeLabel}</td>
                  <td className="px-4 py-3 font-mono">{formatTime(sp.elapsedSeconds ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${STATUS_BADGE[sp.status!]}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mb-3.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Time Comparison</p>
      <div className="mb-6 flex flex-col gap-3.5">
        {timed.map((sp) => (
          <div key={sp.id} className="grid grid-cols-[100px_1fr_56px] items-center gap-3 sm:grid-cols-[140px_1fr_64px]">
            <div className="truncate text-sm text-white">{sp.speakerName}</div>
            <div className="relative h-[26px] overflow-hidden rounded-md border border-slate-700 bg-slate-800">
              <div
                className="h-full rounded-l-md transition-[width]"
                style={{ width: `${Math.min(100, ((sp.elapsedSeconds ?? 0) / maxSeconds) * 100)}%`, background: barColor[sp.status!] }}
              />
            </div>
            <div className="text-right font-mono text-xs text-white">{formatTime(sp.elapsedSeconds ?? 0)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#1c8a4c" }} /> Qualified
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#d19a1f" }} /> Under / Over time
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#c23a2c" }} /> Disqualified
        </span>
      </div>
    </div>
  );
}

export default function TimerSessionPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, updateItem } = useCollection<TimerSession>("/api/timer-sessions");
  const [timingSpeakerId, setTimingSpeakerId] = useState<string | null>(null);

  const session = useMemo(() => data.find((s) => s.id === params.id), [data, params.id]);
  const timingSpeaker = session?.speakers.find((s) => s.id === timingSpeakerId) ?? null;

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading session…</div>;
  if (!session) return <div className="p-6 text-sm text-slate-400">Session not found.</div>;

  if (timingSpeaker) {
    return (
      <FullscreenTimer
        session={session}
        speaker={timingSpeaker}
        onEnd={(result) => {
          updateItem({
            ...session,
            speakers: session.speakers.map((s) => (s.id === timingSpeaker.id ? { ...s, ...result } : s)),
          });
          setTimingSpeakerId(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#0c0c11]">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
        <Link href="/timer" className="rounded p-1.5 text-slate-400 hover:bg-slate-800">
          <ArrowLeft size={16} />
        </Link>
        <p className="text-sm font-semibold text-white">
          Session — {new Date(session.createdAt).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 overflow-auto p-6 sm:p-10">
        {session.ended ? (
          <ReportScreen session={session} />
        ) : !session.wordOfDay ? (
          <SetupScreen onBegin={(word, idiom) => updateItem({ ...session, wordOfDay: word, idiomOfDay: idiom })} />
        ) : (
          <RosterScreen
            session={session}
            onAddSpeaker={(speaker) =>
              updateItem({ ...session, speakers: [...session.speakers, { ...speaker, id: crypto.randomUUID() }] })
            }
            onStartTiming={(id) => setTimingSpeakerId(id)}
            onFinish={() => updateItem({ ...session, ended: true })}
          />
        )}
      </div>
    </div>
  );
}
