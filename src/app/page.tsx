"use client";

import Link from "next/link";
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
  ArrowRight,
  IdCard,
  MessageCircleQuestion,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { useCollection } from "@/lib/useCollection";
import type { Meeting, SpeakerRequest } from "@/lib/types";

const CARDS = [
  { href: "/members", label: "Members", desc: "Club roster, pathways, and roles.", icon: IdCard, color: "text-blue-600 bg-blue-50" },
  { href: "/meetings", label: "Meeting Tracker", desc: "Log meetings, roles, and awards.", icon: CalendarDays, color: "text-teal-600 bg-teal-50" },
  { href: "/speaker-requests", label: "Speaker Requests", desc: "Manage upcoming speech slots.", icon: Users, color: "text-amber-600 bg-amber-50" },
  { href: "/roles-summary", label: "Roles Summary", desc: "Auto-tallied role participation.", icon: BarChart3, color: "text-indigo-600 bg-indigo-50" },
  { href: "/outside-participation", label: "Outside Participation", desc: "Track activity at other clubs.", icon: Building2, color: "text-sky-600 bg-sky-50" },
  { href: "/level-completion", label: "Level Completion", desc: "Pathways progress by member.", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50" },
  { href: "/mentor-assignment", label: "Mentor Assignment", desc: "Pair speakers with mentors.", icon: UserCheck, color: "text-violet-600 bg-violet-50" },
  { href: "/word-of-day", label: "Word & Idiom of Day", desc: "Weekly vocabulary log.", icon: BookMarked, color: "text-rose-600 bg-rose-50" },
  { href: "/timer", label: "Timer", desc: "Run live speech timing sessions.", icon: Timer, color: "text-orange-600 bg-orange-50" },
  { href: "/ah-counter", label: "Ah-Counter", desc: "Tally filler words and pauses.", icon: Ear, color: "text-fuchsia-600 bg-fuchsia-50" },
  { href: "/grammarian", label: "Grammarian", desc: "Track word usage and corrections.", icon: SpellCheck2, color: "text-lime-600 bg-lime-50" },
  { href: "/table-topics", label: "Table Topics", desc: "Draw Easy/Intermediate/Hard topics, no repeats.", icon: MessageCircleQuestion, color: "text-cyan-600 bg-cyan-50" },
];

export default function Home() {
  const { data: meetings } = useCollection<Meeting>("/api/meetings");
  const { data: requests } = useCollection<SpeakerRequest>("/api/speaker-requests");
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Welcome back" description="Here's a snapshot of your club's activity." />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Meetings Logged</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{meetings.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pending Requests</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingRequests}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Requests</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{requests.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.href} href={c.href}>
                <Card className="group flex h-full items-start gap-4 p-5 transition-shadow hover:shadow-md">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{c.label}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{c.desc}</p>
                  </div>
                  <ArrowRight size={16} className="mt-2 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
