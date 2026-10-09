---
title: "Tag Explorer: every balance, traced to its source"
card: "Tag Explorer: every balance, traced to its source"
summary: Fund tracing for a KRW-pegged card system. Every transaction becomes a UTXO with a lineage tag, so auditors and regulators can follow any balance back to where it came from.
outcome: Auditors can pick any balance and follow it back, payment by payment, to where the money came from.
meta: KONA I · Fund tracing · 2025–26
org: KONA Software Lab
client: KONA I (Korea)
years: 2025 – 2026
role: Built with one teammate, and I'm the top contributor. I wrote the React explorer and large parts of the backend, including contribution scoring, UTXO selection and month-end consolidation. My teammate built the core batch pipeline, the in-memory UTXO cache and the Merkle proofs.
status: In production
order: 6
group: kona
published: 2026-10-09
stack: [Java 21, Spring Boot 3.5, Undertow, PostgreSQL, LevelDB, MongoDB, React, TypeScript, Vite, React Router 6, Tailwind, Recharts, i18next, Playwright, Python, Airflow, Spark, Docker, PM2, nginx]
plain: A local-currency card in Korea lets people recharge, pay, send money and donate. Tag Explorer records where every unit of value came from, so an auditor can pick any balance and trace it back through each payment to its source.
diagram:
  caption: Transactions become tagged UTXOs. My part covers selection, consolidation, scoring, most of the APIs and the explorer.
  stages:
    - title: Source
      nodes:
        - { label: Card transactions, note: 23 types }
    - title: Pipelines
      nodes:
        - { label: Batch pipeline, note: transactions to UTXOs }
        - { label: Pull pipeline, note: Airflow + Spark, mine: true }
    - title: Ledger
      nodes:
        - { label: Tagged UTXOs, note: lineage per unit }
        - { label: UTXO selection, note: "seeded, audit-logged", mine: true }
        - { label: Month-end merge, note: "idempotent, chunked", mine: true }
    - title: Services
      nodes:
        - { label: Contribution scores, note: payment depth, mine: true }
        - { label: Explorer APIs, note: "Java 21, Spring Boot", mine: true }
    - title: Explorer
      nodes:
        - { label: Explorer UI, note: "React, English + Korean", mine: true }
---

## How it works

Every card transaction, from recharges, purchases and card-to-card transfers to refunds, donations, remittances and withdrawals (23 types in all), becomes a UTXO: a unit of value with a lineage tag that records where it came from. Spending a balance consumes UTXOs and creates new ones, and the tags carry the history forward. That lets auditors and regulators trace any balance back to its sources.

I added tag-length and depth tracking, so each UTXO records how many times its value has changed hands, and the month-close step turns that into tag-length statistics for the explorer's dashboard. I also added multi-balance UTXOs, so one user can hold more than one kind of balance and each UTXO and tag knows which balance it belongs to.

The server is Java 21 and Spring Boot 3.5 on Undertow. Tagging, staging and explorer data live in separate PostgreSQL schemas, with LevelDB and an optional MongoDB alongside, and it runs under Docker, PM2 and nginx. A batch pipeline my teammate built turns transactions into UTXOs. On top of that I built the services that make the history usable: short-path lineage queries, contribution scores, month-end consolidation, and most of the APIs the explorer calls. Source data comes from HDFS and MySQL into Postgres through a pull pipeline in Python, Airflow and Spark, which I started and built most of.

The explorer is a React app with React Router 6 and four pages (dashboard, transactions, users and contribution). It has five Recharts charts, a lineage path view, Korean time formatting, and English and Korean text. A Show/Hide Merge toggle on the transaction list keeps its state in the URL, so the view survives a page reload.

## Key decisions

### Contribution counts payments, not every hop

A balance can pass through many hands. I wrote the design for scoring how much each person contributed to it: the score measures how many later payments wouldn't have happened if that person hadn't spent the money. It uses the tag's payment depth: the distance to the current owner, counting payment hops only. Remittances, refunds, donations and change don't count as contribution. If someone appears in a tag more than once, each appearance counts separately, with its own depth. Recalculation is atomic, month-aware and runs in the background, with an endpoint to check its status.

### Pick UTXOs in a reproducible random order

When a payment spends part of a balance, the system has to choose which UTXOs it uses. I added seeded random-unique selection: each UTXO is picked at most once, in an order seeded from the transaction itself (its correlation ID and timestamp). The same transaction always picks the same units, whether in a dry run or the real one, and the IDs it picked are written to the audit log, so an auditor can see exactly what was spent.

### Merge UTXOs at month end

Without consolidation, lineage grows forever and every query gets slower. At month end the system merges UTXOs, and the merged unit inherits a tag length weighted by amount, so the history stays meaningful. Merges run in parallel chunks behind an idempotency guard, so a rerun can't merge twice, and a runtime flag switches consolidation on or off without a restart. Audit records use the transaction ID the blockchain returns, not a local one, so each record matches the transaction on the ledger.

### Show the short path

A full lineage graph is unreadable once money has moved a few times. The explorer shows short-path and simple-path lineage and collapses duplicate nodes, so an auditor sees the route that matters first.

## What made it hard

Knowing when a month ends. Batches don't line up with calendar months. I added a month-boundary hook that splits each batch by month and runs the month-close sequence (contribution scores, the month's statistics, then consolidation) in the background. At first it only fired when a month changed inside one batch, so a month that filled whole batches, or the last month before the queue emptied, never closed. Now it also fires across batches and when the queue drains.

Volume. Month-end merges and score recalculations touch a lot of rows, so bulk loads use PostgreSQL COPY, merges run in chunks, and a profiling aspect times the slow paths. I added cache tables for the explorer to read from, refreshed after each batch, and moved member sync to batched SQL instead of one database call per row.

Reruns. Batch jobs fail halfway and get run again. The idempotency guard stops a rerun from merging twice, and score recalculation is atomic, so a failed run never leaves half-updated scores.

An API that changes month to month. I wrote a Playwright API test suite of 32 tests that runs in CI on Node 18 and Node 20 and again every night, and server tests for the month-boundary logic.
