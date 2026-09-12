"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { useMembers } from "@/lib/MembersProvider";
import type { Member } from "@/lib/types";

const DEFAULT_INPUT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onOutside]);
  return ref;
}

function Suggestions({
  suggestions,
  draft,
  exactMatch,
  onPick,
  onAddMember,
}: {
  suggestions: Member[];
  draft: string;
  exactMatch: boolean;
  onPick: (name: string) => void;
  onAddMember: () => void;
}) {
  if (suggestions.length === 0 && (!draft.trim() || exactMatch)) return null;
  return (
    <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
      {suggestions.length > 0 && (
        <ul className="max-h-48 overflow-y-auto py-1">
          {suggestions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(m.name)}
                className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {draft.trim() && !exactMatch && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAddMember}
          className="flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-xs font-medium text-amber-700 hover:bg-amber-50"
        >
          <UserPlus size={12} /> Add &ldquo;{draft.trim()}&rdquo; to Members
        </button>
      )}
    </div>
  );
}

/** Single-name field backed by the Members roster, with an inline "add to Members" prompt for unknown names. */
export function NameField({
  value,
  onChange,
  placeholder,
  className,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const { data: members, addItem } = useMembers();
  const [open, setOpen] = useState(false);
  const containerRef = useClickOutside(() => setOpen(false));

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const pool = q ? members.filter((m) => m.name.toLowerCase().includes(q)) : members;
    return pool.slice(0, 6);
  }, [members, value]);

  const exactMatch = members.some((m) => m.name.trim().toLowerCase() === value.trim().toLowerCase());

  async function handleAddMember() {
    const name = value.trim();
    if (!name) return;
    await addItem({ name, pathways: [], membershipActive: true, clubRole: "" });
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={value}
        required={required}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className ?? DEFAULT_INPUT_CLASS}
      />
      {open && (
        <Suggestions
          suggestions={suggestions}
          draft={value}
          exactMatch={exactMatch}
          onPick={(name) => {
            onChange(name);
            setOpen(false);
          }}
          onAddMember={handleAddMember}
        />
      )}
    </div>
  );
}

/** Multi-name field (chips) backed by the Members roster — for fields that can have more than one winner/speaker. */
export function NameMultiField({
  values,
  onChange,
  placeholder,
  inputClassName,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  const { data: members, addItem } = useMembers();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useClickOutside(() => setOpen(false));

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const pool = members.filter((m) => !values.includes(m.name));
    const filtered = q ? pool.filter((m) => m.name.toLowerCase().includes(q)) : pool;
    return filtered.slice(0, 6);
  }, [members, draft, values]);

  const exactMatch = members.some((m) => m.name.trim().toLowerCase() === draft.trim().toLowerCase());

  function commitName(name: string) {
    const trimmed = name.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
    setOpen(false);
  }

  async function handleAddMember() {
    const name = draft.trim();
    if (!name) return;
    await addItem({ name, pathways: [], membershipActive: true, clubRole: "" });
    commitName(name);
  }

  return (
    <div>
      <div className="relative" ref={containerRef}>
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitName(draft);
            }
          }}
          placeholder={placeholder ?? "Type a name and press Enter…"}
          className={inputClassName ?? DEFAULT_INPUT_CLASS}
        />
        {open && (
          <Suggestions
            suggestions={suggestions}
            draft={draft}
            exactMatch={exactMatch}
            onPick={commitName}
            onAddMember={handleAddMember}
          />
        )}
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-slate-400 hover:text-rose-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
