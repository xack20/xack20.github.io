---
title: An AI assistant bank operators can trust with writes
card: An AI assistant bank operators can trust with writes
summary: Operators ask about products, cards and transactions in English or Bangla. The agent finds the right screen or prepares the change, and nothing takes effect until a person approves it.
outcome: The agent can look things up and prepare changes, but nothing it prepares takes effect until a person approves it.
meta: KONA · Card management · 2026
org: KONA Software Lab
client: Banks using KONA's card management system
years: 2026 – now
role: I designed and wrote most of the MCP tool servers the agents work through, the approval flow for writes that had no human check of their own, and the eval suite we test it with. I also added guardrails to the orchestration service, built the assistant's approval card and chat features in the portal, wrote design docs for the stack, and review and merge the team's changes to it.
status: In active development
order: 1
featured: true
group: kona
published: 2026-10-09
stack: [Java, Spring Boot, Spring WebFlux, PostgreSQL, TypeScript, Node.js, Zod, Python, FastAPI, LangGraph, MCP, Angular, ApexCharts, vLLM, LiteLLM, Qwen]
plain: Bank staff can ask the card system questions in plain English or Bangla and get answers from live data. When they want something changed, the assistant prepares the request for them, but a person still has to approve it before it takes effect.
diagram:
  caption: A question passes through the gateway and the governance service to the agent, which works through the tool servers. Nothing it prepares takes effect until a person approves it.
  stages:
    - title: Portal
      nodes:
        - { label: Bank operator, note: English or Bangla }
        - { label: Approval card, note: a person approves, mine: true }
    - title: Gateway + governance
      nodes:
        - { label: Gateway, note: checks the sign-in }
        - { label: Governance service, note: "WebFlux, PostgreSQL" }
        - { label: Approval ledger, note: single-use tokens, mine: true }
    - title: Orchestration
      nodes:
        - { label: Guardrails, note: "screening, PII masking", mine: true }
        - { label: LangGraph agent, note: "Python, FastAPI" }
        - { label: Lookup check, note: flags unbacked numbers, mine: true }
    - title: Tool servers
      nodes:
        - { label: MCP tool servers, note: 31 tools in 3 tiers, mine: true }
        - { label: Screen finder, note: 156 portal screens, mine: true }
    - title: Card system
      nodes:
        - { label: Card system, note: maker-checker }
---

## How it works

A bank operator types a question into the chat panel of the card management portal. Every question takes the same path. It goes through the gateway, which checks the operator's sign-in, to the governance service, a Spring WebFlux service on PostgreSQL that stores the conversation, runs the guard and holds the approval ledger. From there it goes to the orchestration service, where the agent runs, and the agent reaches the card system only through the tool servers.

Before the model sees a question, it is screened. It has to be in English or Bangla script. A letter check and a list of common Banglish words catch Bangla typed in English letters, and a one-word model check settles the cases they can't. When the guard isn't sure whether a question is harmful, an LLM judge takes a second look. The answer streams back through PII redaction, so card numbers, account numbers and customer ids are masked on the way out.

The orchestration service is Python, built on FastAPI and LangGraph. The agent works through MCP tool servers that I designed and mostly wrote, in Java with Spring Boot and in Node.js. There are 31 tools in three tiers (write, record and reference), plus an action catalog for rarer operations, so the model sees a short tool list and can still reach the long tail. A Node.js screen finder matches questions against the portal's 156 screens, using an index generated from the portal's source and its live menu. The tool servers have about 700 tests between them.

The models run on our own hardware: I set up an NVIDIA DGX Spark serving a 27B Qwen model through vLLM behind a LiteLLM gateway, and moved the agent services onto it, so bank data never goes to an outside model API. A separate case study on [self-hosted LLMs and the card-spec RAG](/work/self-hosted-llms-rag/) covers that stack, its load test and the RAG system our card personalization engineers use every day.

Beyond my own code, I wrote design docs for the stack, including the high-level design for the agentic AI platform and the product-profiles design. I planned and owned the agentic-CMS sprint backlog, and I reviewed and merged the team's changes to the stack.

## Key decisions

### The agent can only be the maker

Banks already run changes through maker-checker: one person prepares a change and another approves it. I made the agent a maker and nothing more. It can save drafts, submit a maker request or ask a person to approve a change, and the checker endpoints are blocked in code. The worst a confused model can do is create a request that someone rejects.

### Approval tokens are bound to the exact change

Maker requests go through the bank's own checker. Writes that have no approval step of their own go to an approval ledger I built in the governance service, on Spring WebFlux and PostgreSQL. When a person approves, the ledger issues a single-use token bound to a hash of the payload. The write happens only when that token is redeemed, so a token can't be replayed, and a change edited after approval no longer matches. You can [try the mechanism in the Lab](/lab/).

### Identity comes from the request, not the model

The bank and the user come from the request headers, never from the model's arguments. If the model could choose which bank it acts for, a prompt injection could choose too.

### Say so when a tool server is down

If one tool server stops answering, the chat keeps working with the tools that are still up, and the model is told which group is missing. It is told to say plainly that it can't reach that data right now, and not to answer from memory or estimate. A number the agent didn't read from the card system is worse than no number, because the operator can't tell the two apart.

## What made it hard

Models make up numbers. A prompt rule already told the agent that every number about the records comes from a tool call. Even so, in a 60-question test sample about 1 in 3 count answers were made up, with no lookup behind them. So I added a lookup check to the orchestration service. An answer that states a number without a tool call behind it is checked once before anyone sees it, and the model is asked to look the number up. The check runs at most once per turn and never loops.

Models also overreach. Asked about a list, a model will sometimes request one lookup per row, and every result piles into the conversation until the answer gets worse. The orchestration service now runs at most 12 tool calls per round and tells the model which calls it skipped, so it can narrow the request instead. Repeated calls in the same round are caught and answered from the first result. How the tool servers themselves are built, tiers, catalog and tests, is in [MCP tool servers for banking agents](/work/mcp-tool-servers/).

Guardrails need evidence. I wrote the eval suite for the whole stack: 57 suites and 2,265 cases covering guard checks, tool calls and chat. In the latest run the guard checks passed 98.7% of their cases, and I traced every failure back to its root cause. The suite and the guardrails it checks have their own write-up in [evals and guardrails for banking agents](/work/agent-evals-guardrails/).

Approvals have to be easy to give. In the Angular portal I built the approval card that shows a person the proposed change, and later made it generic, so a new kind of write doesn't need a portal release. I also added charts in chat, drawn with ApexCharts from the chart blocks the agent's answer carries, and deleting a conversation from the sidebar with an Undo. The assistant's portal module has about 170 unit tests.
