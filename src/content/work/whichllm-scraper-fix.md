---
title: "A silent failure in whichllm's benchmark scraper"
card: "A silent failure in whichllm's benchmark scraper"
summary: whichllm ranks local LLMs partly by a benchmark it scrapes. The site changed format, every fetch failed quietly and rankings ran on a frozen snapshot. I parsed the new stream and made sure a live fetch can only add models.
outcome: Live scores are back, and the benchmark tier grew to 78 models instead of shrinking to 43.
meta: Open source · whichllm · Jun 2026
org: Open source
years: "2026"
role: Wrote the fix and its tests
status: Merged on 10 June 2026
order: 11
featured: false
group: personal
published: 2026-10-09
stack: [Python, httpx, regex, pytest]
plain: whichllm tells you which open AI model will run best on your own computer, and part of its ranking comes from a public benchmark website. When that website changed how it sends its data, the tool quietly kept using an old copy, so I made it read the new format and made sure fresh data can only add models, never remove them.
links:
  - { label: The merged pull request, href: "https://github.com/Andyyyy64/whichllm/pull/97" }
  - { label: whichllm on GitHub, href: "https://github.com/Andyyyy64/whichllm" }
diagram:
  caption: The page now streams its data in chunks. I decode them, pull out each record, map names to models, and lay live scores over the curated snapshot.
  stages:
    - title: Source
      nodes:
        - { label: Leaderboard page, note: App Router stream }
    - title: Decode
      nodes:
        - { label: RSC decoder, note: join + unescape chunks, mine: true }
        - { label: Old-format fallback, note: in case it changes again, mine: true }
    - title: Extract
      nodes:
        - { label: Record extractor, note: "can't cross records", mine: true }
    - title: Map
      nodes:
        - { label: Name canonicaliser, note: about 8 to 46 matches, mine: true }
    - title: Merge
      nodes:
        - { label: Curated snapshot, note: 72 entries }
        - { label: Live over snapshot, note: can only add models, mine: true }
---

## How it works

whichllm is a Python command-line tool with about 6.7k stars on GitHub. It looks at your hardware and finds the local LLM that will run best on it. Part of its ranking comes from the Artificial Analysis (AA) Intelligence Index, a public leaderboard that whichllm scrapes. Each score is mapped to model IDs on Hugging Face through a table of names, and a curated snapshot of 72 entries stands in when the live fetch fails.

The leaderboard moved to the Next.js App Router. Its pages no longer carry the Next.js data blob, the single script tag of JSON the scraper used to read. The data now arrives as React Server Components (RSC) push chunks: many small escaped strings pushed into the page as it streams in.

The scraper's regex looked for the old blob and never matched. Every run raised an extraction error, logged a warning and fell back to the frozen snapshot from May 2026. The tool kept printing rankings, so nothing on screen showed they had gone stale.

My fix lives in the module that fetches the AA scores. A decoder finds every push chunk in the page, unescapes each one as a JSON string and joins them into one text. A record extractor pulls each model's name and its Intelligence Index score out of that text. Name canonicalisation maps the leaderboard's display names onto the existing table. The live scores are then laid over the curated snapshot, and the old format stays as a second fallback.

## Key decisions

### A fetch can only add coverage

The obvious fix is to replace the snapshot with whatever the live fetch returns. But with exact names, only about 8 live models matched the table, so swapping 72 curated entries for them would have made the rankings worse. I overlay instead. The merge starts from the snapshot and adds the live scores on top, so a successful fetch can add models and refresh scores but can never shrink the tier below the snapshot. If no live score maps at all, the fetch still counts as failed and the fallback takes over.

### Canonicalise names instead of growing the table

The leaderboard now labels variants, such as "Qwen3 14B (Reasoning)" or "gpt-oss-20B (high)", and those don't match the names in the table. Rather than add every variant as a new row, I strip the bracketed qualifiers and normalise case and separators, so "Qwen3 14B (Reasoning)" and "Qwen3-14B" end up as the same key. The table's own names go through the same step once, at load time, and an exact match is still tried first. Live name matches went from about 8 to about 46 without growing the table.

### Keep the old format as a fallback

The site changed format once and can change again. The scraper tries the RSC stream first and the old data blob second, and only raises the extraction error when neither gives any records.

### Tests that never touch the network

I added a test file that runs fully offline, using a mock HTTP transport in httpx, so it never calls the real site. It covers name canonicalisation, RSC decoding, the boundary that stops one record leaking into the next, mapping to Hugging Face IDs, the coverage guarantee and the failure path. The rest of the suite still passes.

## Why it was merged

Another contributor opened a fix for the same issue a few hours apart from mine, on the same day. The maintainer tested both against one saved copy of the live page. Both extracted the same 491 (name, score) pairs, so parsing wasn't the difference. The merge design was.

AA had re-scaled its index, and older models now scored far below the snapshot. As the maintainer put it: "Without the overlay the AA tier shrinks from 72 to 43 mapped models; with it the tier grows to 78 and nothing drops out."

The other fix was closed, and mine was merged on 10 June 2026.

## What made it hard

A failure that looked like success. Nothing crashed. The error was caught, a warning went to the log, and the tool printed rankings from the snapshot as usual. The rankings were stale on every run, and nothing on screen said so.

A stream, not a document. The decoded payload is a flat stream of fragments, not one JSON document, so you can't parse it and walk the tree. I match records with a regex instead, and the risk is a match that starts at one model's name and runs on into the next model's score when the first record has no score of its own. The pattern refuses to pass another name field between a name and its score, so a match can't cross into the next record. A test pins that boundary.

Name variants. The same model shows up under several display names: with or without a reasoning label, with an effort level in brackets, with hyphens or spaces. A table keyed on exact names only sees a fraction of them. Canonicalisation fixes this in one place, so the table didn't need a row for every spelling.
