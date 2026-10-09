---
title: "KON-AI: an in-app assistant for Nagad"
card: KON-AI, an in-app assistant for Nagad
summary: The same agent stack, now inside the Nagad mobile wallet for customers and guests. It answers in Bangla, English or Banglish and sends people to the right screen, with PIN-safety rules in code, not in the prompt.
outcome: One agent platform now serves two products, and the wallet assistant can't send someone to the wrong PIN screen.
meta: Nagad · Mobile wallet · 2026
org: KONA Software Lab
client: Nagad
years: "2026"
role: I worked on every part of it and directly with the app team. I wrote the screen finder and utilities tool servers, the product profiles that let one codebase serve two products, the app-header contract, the screen-card event, and Nagad's guard and judge prompts.
status: Integrated into the Nagad app and in testing
order: 4
group: kona
published: 2026-10-09
stack: [Java 17, Spring Boot, MCP Java SDK, Python, FastAPI, LangGraph, Server-sent events]
plain: Nagad customers and guests can ask the app how to do something, in Bangla, English or a mix of the two, and get the steps plus a button that opens the right screen. It can't see balances or move money, and it will never send someone who has lost their PIN to the change-PIN screen.
diagram:
  caption: The same stack as the bank assistant, with a Nagad profile. The answer ends with a screen card that the app turns into a button.
  stages:
    - title: App
      nodes:
        - { label: Nagad app, note: "Bangla, English, mixed" }
    - title: Gateway + guard
      nodes:
        - { label: Gateway, note: app-issued token }
        - { label: Guard per product, note: plus a judge check, mine: true }
    - title: Agent
      nodes:
        - { label: Nagad profile, note: base + product prompts, mine: true }
        - { label: App headers, note: passed to the tools, mine: true }
    - title: Tool servers
      nodes:
        - { label: Screen finder, note: PIN rules in code, mine: true }
        - { label: Utilities, note: "prayer times, weather", mine: true }
        - { label: FAQ search, note: fees and limits }
    - title: Back in the app
      nodes:
        - { label: Screen card, note: tap to open the screen, mine: true }
---

## How it works

KON-AI is an in-app assistant for Nagad customers and guests. It runs on the same stack as the card management assistant. A question from the app comes through the gateway with an app-issued token, passes the guard for its product, and reaches the orchestration service running with the Nagad profile. From there the agent can call three tool servers: a screen finder and a utilities server that I wrote, and an FAQ search a teammate built for fees and limits.

The screen finder exposes one read-only tool. When the agent finds the screen a person needs, the orchestration service sends a screen-card event in the response stream. The app turns it into a button that opens that screen, so the answer ends with something you can tap instead of a list of menu names. Only a screen the screen finder returned in that same turn can become a card, so the model can't send someone to a screen it remembered or guessed.

The assistant answers in Bangla script when asked in Bangla, in English when asked in English, and in simple English when asked in Banglish. It also gives prayer times and the weather for where you are, using the location in the request headers, not anything the model guesses. It can't see balances or act for the user.

A lot of the work was in the words the model reads. In the Nagad profile I wrote the prompt sections for utilities, safety, screen cards and off-topic questions, and most of the identity and scope sections. I wrote Nagad's guard prompt and judge prompt, plus a shared judge prompt for a build that serves both products. I also wrote the deployment runbook for the Nagad rollout.

## Key decisions

### One codebase, two products

Instead of forking the agent for Nagad, I wrote a design for splitting one agent platform into per-product profiles, then built it. The system prompt became a shared base plus a profile per product, I wrote configuration per product and environment, and I made the governance service build per product. The bank operator assistant and KON-AI now ship from the same code.

### The app tells us who it is

I defined the app-header contract with the app team: the platform, the app version, the language and the location. I forwarded those headers from orchestration and governance down to the tool servers. A value that doesn't check out is dropped, never replaced with a default, because answering for the wrong app build shows a screen that has moved.

The screen finder reads the platform (Android or iOS) and the app version from those headers, never from the model. Each release has its own screen index. A newer release falls back to the nearest older index and says so, and a release older than every index gets an "update the app" message. Without the headers, the tool refuses to answer.

### PIN safety lives in code

Rules about PINs are too important to leave in a prompt. If someone says they forgot, lost or blocked their PIN, the change-PIN screen is suppressed. If someone asks *for* a PIN or OTP, they get safety advice and no screen at all. And when a question is about something the app guide doesn't cover, that answer wins over any partial match.

### Fail closed

The screen index is checked strictly at startup, and any problem stops the service with every problem listed. The PIN-safety notes live in their own file so a regenerated index can't overwrite them, and if that file is missing the service won't start. A screen finder that answers without its PIN warnings is worse than one that is down.

## Testing it

To keep all of this honest I built a 368-question test set from two rounds of review, scored by group, and it fails if any group drops below its current score. PIN questions pass 44 of 44, limit questions 37 of 37, change-PIN questions 13 of 13, and questions about another service's charges or limits 14 of 14.

Around that sit the unit tests. The screen finder has 222 tests and the utilities server 66. The screen-card event has 15 of its own in the orchestration service, and 226 governance tests pass on each per-product build.

## What made it hard

Bangla, English and Banglish arrive mixed in one sentence. The matcher handles all three in one pass, but it only matches screen titles and synonyms, never the steps, because "confirm with your PIN" appears in the steps for many screens. A multi-word synonym only counts if all its meaning words are there, so "app kaj korche na" (the app isn't working) isn't read as a PIN problem.

Being sure enough to show a button. Each match comes back as exact, likely or weak, and a weak match can't become a button. The orchestration layer checks that too and refuses to turn a weak match into a card, so a slip in one place isn't enough to send someone to the wrong screen.

The guard was blocking normal questions. I gave each product its own guard rules and added a second judge check for cases the guard isn't sure about. Normal Nagad questions that were wrongly blocked went from 10 of 146 to none.
