---
title: "LMCanvas: branching Claude Code chats"
summary: "A fork of an MIT-licensed canvas where each Claude Code chat is a tree you can branch. I added context-size tracking, one-click and automatic compaction, retries with less context, a model per question, and private access over Tailscale."
meta: "Personal · AI tools · 2026"
org: "Personal project (fork)"
years: "2026"
role: "The canvas is the original author's. Everything on this page is what I added in my fork."
group: personal
order: 3
page: true
stack: [TypeScript, React 19, Electron, Claude Agent SDK, Tailscale Serve, WebSocket, Bun]
links:
  - { label: "Fork on GitHub", href: "https://github.com/xack20/local-lmcanvas" }
published: 2026-10-09
---

## What it is

LMCanvas is a desktop app that drives the Claude Code installed on your machine. Each conversation is a tree of message nodes on a canvas. You can branch from any node to try a different direction without losing the first one. I forked it from an MIT-licensed project and built the features below on top.

## What I added

### Context you can see

Long Claude conversations used to run blind. Now every Claude node shows its own size and the total from the root down to it, measured by Claude Code at the end of each run. A bar under the node turns amber and then red as the model's context window fills. Until a node has been measured, it shows an estimate, marked as one.

### Compaction, automatic or one click

When Claude Code compacts a session on its own, the node now says so while it happens and leaves a divider with the size before and after. I also added two one-click actions: compact a node in place, or continue from a summary in a new node. Both take an optional focus to steer the summary, and both can be stopped.

### Less context instead of an error

Some branches have no session to resume, so the app replays them to Claude Code as text. A long replay used to fail. Now it is fitted to the model's window first: the newest messages are kept word for word and older ones are summarised by separate Claude calls. If Claude Code still says the prompt is too long, the app drops the oldest messages and retries with a smaller budget. A resumed session that overflows is compacted once and the reply retried.

### A model per question

Each node can run on its own model and thinking effort. The picker asks the installed Claude Code which models it offers, so a model added by a Claude Code update shows up without a new release of the app. New child nodes inherit their parent's model and effort.

### Private access from my other machines

I can open LMCanvas in a browser on my other computers while the app runs on my Mac. The Mac still does all the work. The server listens only on the Mac itself and is published to my private Tailscale network with Tailscale Serve, never to the public internet.

## How remote access stays private

Every request passes a security gate that denies by default. A request must carry the Mac's Tailscale name, come from the Tailscale account that owns the Mac, and come from a paired browser. Anything that changes state must also send the exact expected origin. A refused request learns almost nothing, and the log keeps only the method, path and reason.

Pairing uses a one-time link that expires within minutes and needs a confirming click, so a link preview can't use it up. The Mac stores only hashes of device keys and pairing tokens, and removing a device cuts it off at once.

In the desktop app, the interface calls the main process over IPC. In a browser, the same calls go over HTTPS and one WebSocket, through a single registry of handlers. A handler is desktop-only unless it is registered as shared, so pairing, device removal and native dialogs can't be reached from a browser.

Connections drop. When one does, the browser shows a reconnecting banner. If the tab comes back within a short window, it gets the output it missed. If not, its running chats are stopped. A chat can also be edited in only one place at a time, with a "Take over here" button to move it.

## Testing

The fork adds unit tests that run with Bun, plus a type check. Each test file runs in its own process, because some tests point the home folder at a temporary one before loading the storage code.
