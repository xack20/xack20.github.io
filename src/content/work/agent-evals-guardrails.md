---
title: Guardrails for banking agents, and the evals that check them
card: Evals and guardrails for banking agents
summary: Checks on what goes into a banking agent and what comes out, limits on how it uses tools, and a check for numbers it never looked up. I wrote the eval suite that tests all of it, 57 suites and 2,265 cases.
outcome: The rules that matter run in code, not in the prompt, and a 2,265-case eval suite shows whether they still hold.
meta: KONA · Agent safety · 2026
org: KONA Software Lab
client: Banks using KONA's card management system, and Nagad
years: "2026"
role: I added the guardrails in the orchestration service, built the screening around a teammate's guard model, wrote each product's guard and judge rules, and wrote the eval suite we test the stack with.
status: In active development
order: 3
featured: false
group: kona
published: 2026-10-09
stack: [Python, FastAPI, LangGraph, Java, Spring WebFlux, Qwen, LiteLLM, YAML, pytest, Postman]
plain: An assistant that works with bank data has to turn away the wrong questions, keep personal details out of its answers, and never invent a figure. I built the checks that make it behave that way, and a large set of test questions that shows whether they still work.
diagram:
  caption: Checks on the way in, limits while the agent works, redaction on the way out, and an eval suite that tests all of it.
  stages:
    - title: Way in
      nodes:
        - { label: Safety guard, note: a teammate's model }
        - { label: Product rules, note: own guard per product, mine: true }
    - title: Screening
      nodes:
        - { label: Language check, note: "letters, words, model", mine: true }
        - { label: Second judge, note: when the guard is unsure, mine: true }
    - title: Agent
      nodes:
        - { label: Tool-call limits, note: "12 per round, no repeats", mine: true }
        - { label: Lookup check, note: numbers need a tool call, mine: true }
    - title: Way out
      nodes:
        - { label: PII redaction, note: on the output stream, mine: true }
    - title: Evals
      nodes:
        - { label: Eval suite, note: "57 suites, 2,265 cases", mine: true }
        - { label: Corpus test, note: 368 Nagad questions, mine: true }
---

## How it works

The guardrails sit at three points: before the agent runs, while it works, and as the answer streams out.

On the way in, a teammate set up the safety guard model that screens every question, and I built the screening around it. Questions to the bank operator assistant have to be in English or Bangla. The cheapest check runs first: the letters used, then a list of common Banglish words, and the model only for what those two can't decide. Banglish or any other language gets a fixed reply in both languages. When the guard is unsure about a question, a second judge, the chat model with its own instructions, takes a look. Only the judge's allow lets a borderline question through.

While the agent works, the orchestration service runs at most 12 tool calls in one round. Calls over the cap aren't dropped silently: each comes back saying it was skipped and why, so the model narrows its request. A call repeated with the same arguments in the same turn is answered from the earlier result instead of running again, and identical calls in one batch run once. If a [tool server](/work/mcp-tool-servers/) is down, the agent carries on with the tools it has and is told which ones are missing.

On the way out, PII redaction runs on the output stream. The prompt already told the model to mask ids, and it mostly did. "Mostly" was the problem: told more firmly, it masked the ids and then added each customer number in brackets. Masking tool results before the model sees them would be stronger, but the agent needs the real id to get from a person to their cards and transactions. So the value is allowed in, used, and stopped where the text leaves the service.

Then the lookup check. The prompt already said every number about the records must come from a tool call. In a 60-question test sample, about 1 in 3 count answers were still made up with no lookup behind them. Now an answer that states a number, in a turn that called no tool, is checked once before anyone sees it. A quick yes-or-no question to the model comes first: is any number here a fact about the records? A year or a step number isn't. Only a clear no keeps the answer. Otherwise the model is asked once more to look the number up. The check runs at most once per turn and never loops.

## Testing it

I wrote the eval suite for the whole stack: 57 suites and 2,265 cases, written as YAML files the team can extend. Some cases send a question only to the guard. Some run the guard and the real screening code without the agent. Some are full chats through the stack, and some call one tool directly with no model at all. The checks cover the answer's language, no card number in clear, no tool, model or vendor names leaking into answers, which tools were called, whether an approval card was raised, and a rubric in plain English that a model grades.

In the latest run, guard checks passed 98.7% of their cases. I traced every failure to a root cause and checked each cause a second time against the code it pointed to. Each one came down to a real defect, a case I had written wrong, a question that needed a decision, or the model varying between runs.

For [KON-AI](/work/kon-ai-nagad/) there is a 368-question test built from review questions, scored by group. PIN questions pass 44 of 44, limits 37 of 37, change PIN 13 of 13, and questions about a charge or limit on another service 14 of 14. The test fails if any group drops below its current score, so a tuning change can't quietly make things worse.

Around the stack:

- about 700 tests across the tool servers
- 226 tests in the governance service, passing on each of its per-product builds
- 2,265 eval cases in 57 suites
- a 75-request end-to-end API collection covering the whole stack

## Key decisions

### Safety rules live in code, not in prompts

A prompt rule is a request to a model. Redaction, the lookup check, the tool-call cap and KON-AI's PIN rules run in code, around the model, so they hold even when it ignores its instructions.

### Measure before tuning the prompt

Before the lookup check, we tried taking the real numbers out of the prompt's examples. That moved the errors around without lowering them. A rule whose failure puts a wrong fact in front of a person needs a check after the answer, not better wording. The guard changes were measured on test questions before and after, and the corpus test's rule is to add a question before changing a weight.

### A separate guard per product

The guard sees the bare question, so ordinary card work reads as risky to it. "Lock this user, he left the company" and a request to delete audit log entries come back borderline with the same kind of category, so a rule on the verdict alone can't tell business from abuse. The bank assistant's judge instructions settle it: locking a user is normal work, deleting audit logs is not. And a wallet customer asks different things from a bank operator. Each product gets its own guard and judge instructions. For KON-AI, normal Nagad questions that were wrongly blocked went from 10 of 146 to none.

### Safety checks fail closed, language checks fail open

If the judge doesn't answer in time, the question is stopped. If the language check doesn't answer, the question goes through: it's a language rule, not a safety one, and the guard has already seen the question.

## What made it hard

Answers vary. The model isn't fully deterministic, even at its lowest temperature, so the suite leans on which tools were called and on rubrics more than exact wording. One failed chat case is a reason to rerun it, not a verdict.

The model is shared. Everyone on the dev environment uses the same rate-limited key, so a full run goes in order, chat first and screening after, never both at once. A screening timeout under load means rerun, not fail.

And checks make people wait. Holding every answer written without a tool until the lookup check finished meant some sat blank, then arrived whole. Now data questions ("how many", "list", "show") are held until checked, and other answers stream whole sentences up to the first one that states a number the person didn't type.
