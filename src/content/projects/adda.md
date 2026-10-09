---
title: "Adda: a bilingual party game in real time"
summary: "A party game for friends in the same room, with word decks in Bangla and English. Each game room runs as its own Cloudflare Durable Object, and one Svelte 5 web app also ships as iOS and Android apps. A solo project with about 296 tests."
meta: "Personal · Multiplayer game · 2026"
org: "Personal project"
years: "2026"
role: "Solo. I built the game rules, the room server, the web app and the mobile apps."
group: personal
order: 5
page: true
stack: [TypeScript, Svelte 5, Vite, PartyKit, Cloudflare Workers, Durable Objects, Capacitor, PWA, Playwright]
links: []
published: 2026-10-09
---

## What it is

Adda is a clue-giving party game for people in the same room, in the style of Monikers and Time's Up. Everyone plays on their own phone. Players pair up, and on a pair's turn one partner sees a word and gives clues while the other guesses out loud. The guesser swaps each time the pair comes up. The same deck is played three times with stricter clues each round: any words but the answer, then one word, then mime only. The word decks are my own, in Bangla and English.

## How it works

### The rules are a pure function

All the game rules live in one small TypeScript package with no runtime dependencies. It takes the current state, an action, the time and a source of randomness, and returns the new state plus a list of effects, such as "tell everyone" or "set the turn timer". Because time and randomness come in from outside, every rule can be tested with exact, repeatable results.

### One room, one Durable Object

Each game room is its own Cloudflare Durable Object, built with PartyKit's server library. The room is the single source of truth for its deck, current card, timer, turn order and scores. It applies the rules to each player's action and carries out the effects, sending updates to every phone.

### The turn timer

The server doesn't tick a clock. When a turn starts it sends the end time once, and each phone draws its own smooth countdown from that. The turn really ends when the Durable Object's alarm fires, so the server stays in charge without any traffic per second, and an idle room can sleep.

### The word stays secret

Only the clue-giver may see the word. The server sends it privately to that player's connections, and the snapshot everyone else gets has it removed. The phones of the guesser and the other pairs never receive it at all.

### One app, three platforms

The client is a Svelte 5 web app that installs as a PWA. Capacitor wraps the same build as native iOS and Android apps. The native shell adds deep links, a QR scanner to join a room, status-bar colours and haptics. The game code is unchanged, and the native parts switch on only inside the apps, so the web build is unaffected.

## Testing

There are about 296 tests. Unit and integration tests cover the rules, the word decks, the room server and the web app. Playwright end-to-end tests play whole games with four players in separate browser sessions, through all three rounds to the end. In every round they check that the word shows only on the clue-giver's screen.

## Finding the bugs

I ran a deep QA pass with AI agents, including a 33-agent bug-hunting audit that tried to break the game on purpose. Together they turned up 15 defects, and I fixed all 15. Each fix started with a test that reproduced the bug and failed, then the fix, then the whole suite again.

The worst one could freeze a game for everyone. If a player in the pair whose turn it was left or was kicked mid-turn, the turn order still pointed at a broken pair, the timer kept going, and nobody was allowed to move the game on. Now a departure from the active pair ends the turn cleanly, puts the card back in the pile, and the others play on.

Others were quieter. A player with two tabs open, or one who reconnected mid-turn, could miss the secret word. A host could kick themselves out of their own room. A match could start with a half-formed pair or an empty deck. And some faint text and one button colour failed the contrast check for accessibility.
