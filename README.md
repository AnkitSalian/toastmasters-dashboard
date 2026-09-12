# Toastmasters Dashboard

A club-operations dashboard for Toastmasters clubs — meeting tracking, speaker requests, member roster, and live role-player tools (Timer, Ah-Counter, Grammarian).

## Features

- **Members** — club roster with pathways, membership status, and club-level roles. Every "name" field across the app is linked to this roster to avoid duplicate/inconsistent entries.
- **Meeting Tracker** — full meeting log with roles and awards, color-coded by meeting type, Excel export.
- **Speaker Requests** — upcoming speech slot requests with assignment tracking.
- **Roles Summary** — auto-tallied from the Meeting Tracker: who has done which role, and how often.
- **Outside Participation, Level Completion, Mentor Assignment, Word & Idiom of the Day** — supporting member-growth tracking.
- **Timer** — live speech timing with green/yellow/red thresholds and grace periods, matching standard Toastmasters timing rules.
- **Ah-Counter** — tally filler sounds, crutch words, pauses, and repetitions per speaker, with charts.
- **Grammarian** — track word/idiom usage, good words, notable expressions, and grammar corrections.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Recharts · ExcelJS

Data is stored as local JSON files under `data/` (created automatically on first run) — no external database required.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
