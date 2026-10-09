---
title: Banking agents that never touch the card system directly
card: MCP tool servers for banking agents
summary: KONA's agents reach the card system only through MCP tool servers, most of which I designed and wrote. There are 31 tools in three tiers, an action catalog for rarer jobs, and a screen finder over 156 portal screens. The same pattern now serves Nagad.
outcome: The agents can read live card data and prepare changes, but every call goes through a tool server that fixes what is possible and which bank it acts for.
meta: KONA · Agent tooling · 2026
org: KONA Software Lab
client: Banks using KONA's card management system, and Nagad
years: "2026"
role: I designed and wrote most of the tool servers. That covers the card system server, the portal screen finder, and the two servers behind KON-AI in the Nagad app.
status: In active development
order: 2
featured: false
group: kona
published: 2026-10-09
stack: [Java, Spring Boot, MCP Java SDK, JavaScript, Node.js, MCP TypeScript SDK, Zod, SSE]
plain: An AI assistant can't be handed the keys to a bank's card system. Instead it gets a fixed set of tools, each of which knows who is asking and what it may do, and any change it prepares stops at a draft or a request that a person decides on.
diagram:
  caption: Both agents reach their systems only through tool servers. On the card side every tool sits in one of three tiers, and a write ends as a draft, a maker request or an approval card.
  stages:
    - title: Agents
      nodes:
        - { label: Bank assistant, note: operators in the portal }
        - { label: KON-AI, note: Nagad app customers }
    - title: Tool servers
      nodes:
        - { label: Card tool server, note: 31 tools + a catalog, mine: true }
        - { label: Screen finder, note: 156 portal screens, mine: true }
        - { label: Nagad tool servers, note: "app screens, utilities", mine: true }
    - title: Card tiers
      nodes:
        - { label: Write, note: drafts or maker only, mine: true }
        - { label: Record, note: "cardholders, cards", mine: true }
        - { label: Reference, note: products and setup, mine: true }
    - title: Behind the tools
      nodes:
        - { label: Card system, note: "drafts, maker requests" }
        - { label: Approval ledger, note: writes with no checker, mine: true }
---

## How it works

The agents at KONA never call the card system themselves. Everything they can do goes through MCP tool servers: small services that publish a fixed list of tools a model can call. I designed and wrote most of them.

The main one is a Java and Spring Boot server on the official MCP Java SDK. It covers the card management system: products, BINs, schemes, card ranges, policies, limits and fees, cardholders, cards, transactions, and figures from the reporting warehouse. It has 31 tools in three tiers. Reference tools read setup data such as products and schemes. Record tools read cardholders, their cards and their transactions, which is personal data. Write tools prepare a change. A tool with no tier is refused at its first call, and a test keeps the tool list and the tier list identical.

Rarer operations sit in an action catalog. Instead of a tool each, the model gets a pair: one searches the catalog and returns matching actions with the arguments they take, and the other runs the one it picked. Every catalog action still has its own tier and its own checks.

Writes follow what the portal does for the same change. Where the portal keeps a draft, the tool saves a draft and a person submits it. Where the bank runs maker-checker, the tool files a maker request and the bank's checker decides. The agent is only ever the maker: the checker endpoints are blocked in code before a call is sent. Where the portal writes with no second person, the tool raises an approval card backed by the approval ledger described in [the assistant case study](/work/agentic-cms-assistant/). Only a clear rejection proves nothing was written, so any other failure tells the operator to check before trying again, and nothing retries on its own.

Identity never comes from the model. The bank and the user arrive in request headers set at the edge, and a call without the bank in its headers is refused. The model chooses what to look up, never which bank it acts for.

The second server is a screen finder. When the agent can't do something itself, it can still say where to do it in the portal, with the real menu path and the real button and field names. It matches a question against an index of 156 portal screens, generated from the portal's own source plus its live menu. The menu is fetched when the index is built, so the running server holds no login and makes no calls. It's a Node.js server on the MCP TypeScript SDK, with Zod describing its input.

The Java servers offer both MCP transports, SSE and streamable HTTP, from one tool list. The screen finder speaks SSE, which is what the orchestrator connects with. The tool servers have about 700 tests between them, most of them on the card system server.

## Key decisions

### A short tool list, and a catalog for the rest

The model we serve gets slower and chooses worse as its tool list grows. So the actions operators use most get dedicated tools, and the long tail sits behind the catalog. The model sees a short list and can still reach everything.

### Generate the screen index, never write it by hand

Nothing in the index is typed by a person, so it can't describe a screen that isn't there. An agent that invents a menu path costs an operator more time than one that says it doesn't know. The path comes from the menu service rather than the routes, because route names aren't anything an operator can click. What the source can't know, such as why a rule exists, goes in a small set of hand-written notes. Notes stay labelled all the way into the answer, so the agent can pass one on without stating it as certain fact.

### Spring Boot by default, Node.js only where the job needs it

The screen finder's whole job is reading the portal's Angular and TypeScript source. Reading that source from Node, the toolchain the portal is built with, beats keeping a second parser in Java in step with a codebase it can't compile against. Every other server is Java.

## The same pattern for Nagad

For [KON-AI](/work/kon-ai-nagad/), the Nagad app's assistant, I wrote two more servers on the same Java stack. The app screen finder has a single read-only tool that matches Bangla, English and Banglish questions to app screens. The platform and app version come from request headers, and without them it refuses. The utilities server gives prayer times and the weather. The model never sends the place: the position arrives in request headers, because a model asked for coordinates supplies plausible ones and the answer then belongs to somewhere else. A teammate built the utility service it calls. KON-AI is integrated into the Nagad app and in testing.

## What made it hard

Long-lived sessions. While the assistant was still in development, the card tool server stopped answering after a few days of running. The port still listened, but requests queued and nothing came back. The orchestrator opens a fresh MCP session for every request and drops it when the run ends, and a server only notices a client has gone when it next writes to the socket. An idle SSE stream is never written to, so every dropped session kept its socket until the server hit its connection limit. A server-initiated keep-alive ping fixed it: the ping is the write that lets the server see the client has gone and release the connection. Before turning it on, I checked that the Python client answers pings.

The hang showed a second problem. The orchestrator refused every request when any tool server was unreachable, so one stuck server silenced the whole assistant, even for questions that needed no tools. The rule had a good reason: an agent missing its transaction tool will answer from its own head, and a plausible invention can't be undone. I kept that property and changed the mechanism. The orchestrator now carries on with the tools it has and tells the model, in plain words, which ones are missing, so the prompt's rules make it say what it can't do instead of guessing. If every server is down, it still refuses. More on these limits in [evals and guardrails](/work/agent-evals-guardrails/).

Overlapping conversations. The screen finder first shared one MCP server instance across connections. It passed testing, where connections came one at a time, and failed on dev as soon as conversations overlapped. It now builds a fresh server per connection and shares only the read-only index.
