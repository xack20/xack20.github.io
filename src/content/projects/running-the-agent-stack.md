---
title: "Making KONA's agent stack easy to run and deploy"
summary: "One command to build, check, start and stop the agent stack on a laptop, a harness for testing logins end to end, a Claude Code skill for the team, and deploy jobs that fail when the old process is still running."
meta: "KONA · Developer tooling · 2026"
org: "KONA Software Lab"
years: "2026"
role: "I wrote the stack runner, the auth test harness and the team's Claude Code skill, and rewrote the deploy jobs."
group: kona
order: 1
page: true
stack: [Python, Bash, YAML, Next.js, React 19, TypeScript, JWT, JWKS, Jenkins, Claude Code]
links: []
published: 2026-10-09
---

## What it is

The agent stack behind KONA's card management assistant, with the portal around it, spans six repos in Java and Spring Boot, Python, Node.js and Angular. Each had its own way to build, configure and start. I built the tooling that lets anyone on the team run the whole stack on a laptop with one command, test it end to end with real logins, and trust a deploy job when it says the deploy worked.

## What I built

- **A one-command stack runner.** A generator installs the same commands into all six repos: build, doctor, start, stop, status and logs, plus restart. Every command except build takes a tier, and you can name one service or act on all of them.
- **An auth test harness.** A local JWKS server, a script that mints JWTs, and a Next.js chat console.
- **A Claude Code skill.** I packaged the runner, the launch steps and the known traps as a skill, so a teammate can ask Claude Code to bring the stack up.
- **Deploy jobs that can't go falsely green.** I rewrote four Jenkins deploy jobs.

## How it works

### The same commands everywhere

The generator writes a small run folder into each service, laid out the same way as on the dev server, and it can be run again safely. Doctor checks the toolchain, the built artifact, the secrets, the ports and the services a process depends on, and it refuses to start anything until they're all in place.

### Config you can read, with no secrets in it

The runner converts each Java service's properties files to YAML. It doesn't trust its own conversion: it flattens the YAML back out and compares every key and value with the original. If a single one differs, it keeps the properties file, because a config file that is almost right is worse than one left alone.

It also moves secrets out of the config. Any setting whose name ends in password, secret, token, API key, private key or credential gets an environment variable in place of its value. The real values live in a secrets file that is never committed and loads before the tier's settings, so no config file in git holds a credential. Matching only the end of the name was a deliberate choice: matching anywhere in the name caught a cron schedule with "token" in its name, and moving that out would have left the service with no schedule and no clue why.

### A true local tier

Before, running "on dev" from a laptop could quietly talk to the dev server and never exercise the code on the laptop at all. The new local tier fixes that. The services talk to each other on 127.0.0.1, while the data still comes from dev, so you get an end-to-end test without a database of your own.

### Testing logins end to end

The stack's gateway checks every request's token against a published key set. The harness serves that key set locally from a throwaway signing key that is trusted only on that machine. The first version made a new key on every start, which silently killed every token already minted, so now it reuses the key and makes one only when none exists. The minting script signs a token for any user and role. The chat console drives the agent from a browser: it keeps threads in local storage, shows the agent's steps as they happen, and sends the conversation's ID back on each message so the agent keeps its context.

### Deploys that tell the truth

A deploy could show green while the old version kept serving. Each rewritten job now notes which process is running before the deploy, stops it, and waits until it is really gone. If it isn't, the build fails. It also frees the service's ports from any stray copy and fails if they stay taken. The health check passes only when the service answers and the process answering is the new one.
