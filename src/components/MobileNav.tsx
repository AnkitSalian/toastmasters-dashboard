"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Mic2 } from "lucide-react";

const LINKS = [
  { href: "/members", label: "Members" },
  { href: "/meetings", label: "Meeting Tracker" },
  { href: "/speaker-requests", label: "Speaker Requests" },
  { href: "/roles-summary", label: "Roles Summary" },
  { href: "/outside-participation", label: "Outside Participation" },
  { href: "/level-completion", label: "Level Completion" },
  { href: "/mentor-assignment", label: "Mentor Assignment" },
  { href: "/word-of-day", label: "Word & Idiom of Day" },
  { href: "/timer", label: "Timer" },
  { href: "/ah-counter", label: "Ah-Counter" },
  { href: "/grammarian", label: "Grammarian" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 text-white md:hidden">
      <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-900">
          <Mic2 size={16} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold">Toastmasters Dashboard</span>
      </Link>
      <button onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[52px] z-40 max-h-[70vh] overflow-y-auto border-b border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === link.href
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
