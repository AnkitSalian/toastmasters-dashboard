"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  BarChart3,
  Building2,
  GraduationCap,
  UserCheck,
  BookMarked,
  Timer,
  Ear,
  SpellCheck2,
  Mic2,
  IdCard,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Club Operations",
    items: [
      { href: "/members", label: "Members", icon: IdCard },
      { href: "/meetings", label: "Meeting Tracker", icon: CalendarDays },
      { href: "/speaker-requests", label: "Speaker Requests", icon: Users },
      { href: "/roles-summary", label: "Roles Summary", icon: BarChart3 },
    ],
  },
  {
    label: "Member Growth",
    items: [
      { href: "/outside-participation", label: "Outside Participation", icon: Building2 },
      { href: "/level-completion", label: "Level Completion", icon: GraduationCap },
      { href: "/mentor-assignment", label: "Mentor Assignment", icon: UserCheck },
      { href: "/word-of-day", label: "Word & Idiom of Day", icon: BookMarked },
    ],
  },
  {
    label: "Role Players",
    items: [
      { href: "/timer", label: "Timer", icon: Timer },
      { href: "/ah-counter", label: "Ah-Counter", icon: Ear },
      { href: "/grammarian", label: "Grammarian", icon: SpellCheck2 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5 hover:bg-slate-800/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-900">
          <Mic2 size={18} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Toastmasters Dashboard</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
        Data stored locally as JSON
      </div>
    </aside>
  );
}
