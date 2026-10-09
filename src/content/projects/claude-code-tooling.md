---
title: "Tools I built around Claude Code"
summary: "I use Claude Code every day, so I built tools around it: a local dashboard that keeps my usage history after Claude Code deletes old transcripts, and a rewritten status line that shows rate limits, context and session tokens at a glance."
meta: "Personal · Developer tools · 2026"
org: "Personal projects"
years: "2026"
role: "I built the usage dashboard on my own, and rewrote the status line script in my fork of an MIT-licensed project."
group: personal
order: 4
page: true
stack: [TypeScript, Next.js 15, React 19, SQLite, Recharts, Zod, Vitest, launchd, Bash, jq]
links: []
published: 2026-10-09
---

## What it is

I use Claude Code every day. Claude's own usage page shows only a live snapshot, with no history, so I built a dashboard that keeps one. I also wanted my rate limits and context in view while I work, so I rewrote a status line.

## The usage dashboard

Claude Code writes a transcript for every session and deletes old ones after a while. An open-source reader, ccusage, can sum those transcripts, but it can't see what is already gone. The dashboard runs ccusage and snapshots its output into a local SQLite database before the transcripts rotate out, then charts it. History keeps growing for as long as it runs.

The key rule is "never delete". Ingest only inserts or updates rows. A day that is missing from a later run, because its transcript has been deleted, stays in the database. Tests cover that rule directly, along with the weekly, monthly and yearly sums and the streak count.

The charts show cost and tokens by day, week, month or year, split per model, with the change from the previous period and the most expensive sessions. Costs are labelled as estimates, not a bill.

It also tracks rate-limit windows. A small status-line hook reads the rate-limit data Claude Code hands to the status line and appends a snapshot to a log. The hook never throws, because a status line must never break Claude Code, and it keeps showing whatever status line was there before. The dashboard turns those snapshots into the five-hour and weekly windows, the time until each resets, and patterns by hour and weekday.

Ingest runs automatically every day through launchd, even when the app is closed, and the app refreshes on load if its data is stale.

## The status line

The status line is the line Claude Code shows at the bottom of its window. I forked an MIT-licensed one and rewrote nearly all of its script. It now shows the model, bars for the 5h and 7d rate limits with a countdown to each reset, a context bar, the session's token total, git state and the folder.

The token total isn't in the data Claude Code passes in, so the script sums it from the session's transcripts. Two traps made that harder than it looks. Claude Code writes each assistant message to the transcript more than once, so rows are deduplicated by message ID. And subagents keep their tokens in separate files, so those are included too. A full scan is too slow to run on every refresh, so the total is cached, keyed on the transcripts' size, and recomputed only when they change. The cache is written to a temporary file and renamed, so two refreshes at once can't tear it, and a half-written last line is skipped instead of breaking the scan.

It runs on both BSD (macOS) and GNU (Linux), picking the right flags at runtime. The upstream script called a macOS-only option, which broke on Linux after the first run. Where bash 4 features are missing, as on the bash 3.2 that macOS still ships, it falls back to a slower path that works. The git segment now uses one status call, which also notices untracked files.

I reworked the install script and added an uninstall script, a bundle script that builds one self-contained installer to copy to a server over ssh, and a test script that renders sample inputs and checks the output.

## Testing

The dashboard has Vitest tests for the never-delete rule, the period sums, the streaks and the rate-limit analytics. The status line has its test script, which runs in a throwaway folder and touches nothing else.
