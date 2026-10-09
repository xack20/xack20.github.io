---
title: "Reporting and data for a multi-bank card platform"
card: Reporting and data for a multi-bank card platform
summary: A dashboard API for card issuers, cardholder reports scoped to each bank, an ETL that records what every load actually did, and Superset dashboards rebuilt from code, all on KONA's Oracle star-schema warehouse.
outcome: Each bank sees only its own cardholders, and a load that moves nothing now shows up instead of passing as a success.
meta: KONA · Reporting and data · 2026
org: KONA Software Lab
client: Card issuers on KONA's card management system
years: "2026"
role: I built the dashboard API for card issuers, made the cardholder reports bank-aware, hardened the Spring Batch ETL, set up Superset over the warehouse, and fixed the order of card updates through Kafka Connect.
status: Built for KONA's card management system
order: 7
featured: false
group: kona
published: 2026-10-09
stack: [Java, Spring Boot, Spring Batch, Oracle, JasperReports, Kafka Connect, Apache Superset, Docker Compose]
plain: Banks that issue cards on KONA's platform get dashboards and reports about their cards and transactions. I built the data API behind those dashboards, made sure each bank only ever sees its own cardholders, and made the nightly data loads say so when they quietly load nothing.
diagram:
  caption: Card data flows through Kafka Connect and a nightly ETL into the warehouse, where the dashboard API, the reports and Superset read it.
  stages:
    - title: Source
      nodes:
        - { label: Card platform data, note: "cards, transactions" }
    - title: Ingest
      nodes:
        - { label: Kafka Connect, note: into staging tables }
        - { label: Card topic keyed, note: "by card ID, in order", mine: true }
    - title: ETL
      nodes:
        - { label: Spring Batch ETL, note: staging to star schema }
        - { label: Load tracking, note: 27 tables, mine: true }
        - { label: Rerun safety, note: "overlap, version guard", mine: true }
    - title: Warehouse
      nodes:
        - { label: Oracle star schema, note: facts and dimensions }
    - title: Read side
      nodes:
        - { label: Dashboard API, note: "7 endpoints, per bank", mine: true }
        - { label: Report scoping, note: "15 reports, per bank", mine: true }
        - { label: Apache Superset, note: "16 charts, read-only", mine: true }
---

## How it works

Card and transaction data starts in the card platform's own databases. Kafka Connect copies each change into staging tables in an Oracle warehouse. A nightly Spring Batch ETL turns staging into a star schema: fact tables hold the events and counts (transactions, balances, active cards), and dimension tables hold the things those facts describe, such as cards and products. Everything that reads the warehouse sits on top.

The first reader is a dashboard API for card issuers that I built. It has 7 read-only endpoints behind the dashboard's widgets: active cards, the card lifecycle, a transaction summary, the transaction success rate, a transaction overview by network, top merchant categories, and the card product portfolio. The overview and the merchant categories take a network filter, and the success rate takes a channel filter. The success rate is recomputed from the summed figures, never averaged across channels, because an average of rates can be far from the real rate. Every response also says when its table was last loaded and whether that load worked.

The second is the reporting service, which renders reports with JasperReports. I made all 15 of its cardholder reports bank-aware behind a rollout flag, so each bank sees only its own cardholders.

The third is Apache Superset 6.1, which I set up on Docker Compose with 6 services: a metadata database, a Redis cache, a one-time init job, the web app, a worker and a scheduler. Redis caches chart results, so repeated dashboard refreshes don't keep hitting Oracle. A script rebuilds a published 16-chart dashboard over 6 datasets, with KPIs, transactions by channel, type, merchant category and currency over time, card balances and status, and activations.

I also did a security review of the reporting service.

## Key decisions

### Each bank sees only its own cardholders

The platform serves several banks from one warehouse. The bank comes from a header the gateway sets after checking the caller's sign-in, never from a query parameter or the request body. Every dashboard query is scoped to that bank, and a request without it is rejected rather than served unscoped.

The reports needed a rollout plan. The fact tables had no column to scope by, so I added the bank to them in the ETL first. Existing rows start with no bank, and the filter is an equality test, so switching it on before the backfill would have given every bank empty reports. So the backfill comes first, and the scoping fails closed: a report request without a bank is rejected, not served unscoped. One fact stored card counts across all banks in a single row, so I re-grained it per bank and rebuilt it instead of backfilling it.

### Record what every load actually did

Spring Batch keeps its own bookkeeping, but for most of our steps it records no row count. A step that loaded thousands of rows looked the same as one that loaded none. I added a load-status table with one row per warehouse table: when it was last written, whether that worked, how many rows moved, and which date window the run covered. It tracks 27 tables. A listener attaches itself to every step, so a new step is covered without anyone remembering to add it. An unknown row count is stored as empty, not as zero, because telling "nothing moved" apart from "not known" is the whole point. The dashboard's freshness labels read this table.

### Make every rerun safe

Batch jobs get run again, and some rows reach staging late. Windowed steps now re-read one day before their start date, so late rows are still merged. Dimension merges only update a row when the staging copy is at least as new as the warehouse copy, by version, so an older copy never overwrites a newer one. A sweep removes cards that the card system deleted. It is off by default, and it skips itself when the source looks empty or a delete would go past a set limit. Some transaction facts were insert-only, so a later change to a transaction, such as a reversal, could never reach the warehouse. I turned those into upserts.

### Read-only BI, and dashboards as code

Superset connects through its own least-privilege, read-only database user. Superset's own "no writes" settings are checked by its SQL parser, not by Oracle, so the real protection is the database grants. The dashboard comes from a script that is safe to run again, so it can be rebuilt the same way on a fresh install instead of being put together by hand.

## What made it hard

Loads that fail quietly. A step that merges nothing still finishes as "completed". The load tracking surfaced a dimension that had been silently loading nothing. Before, catching that meant counting staging rows against the warehouse by hand. Now it shows up in one query, and I fixed that step's date window.

Card updates arriving out of order. Kafka Connect writes with several tasks in parallel, so versions of the same card could be written out of order, and the staging copy could step back to an older version. I keyed the card topic by card ID, so every version of one card goes to the same partition and is written in order. The version guard in the ETL backs this up. The connector configs now live in the repo, applied by a script that updates them in place and keeps their offsets. It refuses to create a missing sink, because a new sink would replay the whole topic.
