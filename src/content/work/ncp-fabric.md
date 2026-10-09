---
title: A token-backed commerce platform on Hyperledger Fabric
card: A token-backed commerce platform on Hyperledger Fabric
summary: Offline transaction signing, HSM-backed identities, and messaging that survives a broker outage. I was its top contributor.
outcome: Users sign their own transactions, and the gateway keeps them flowing when a broker or an instance goes down.
meta: KONA I · Blockchain · 2022–25
org: KONA Software Lab
client: KONA I (Korea)
years: 2022 – 2025
role: Top contributor to NCP (New Commerce Platform). I owned the token management gateway between the platform and Fabric, built the signing portal, wrote most of the Fabric operations scripts, restructured the test automation, and worked directly with the Korea team, in English, on requirements, demos and releases.
status: Live for KONA I in Korea
order: 8
group: kona
published: 2026-10-09
stack: [Node.js, Express, Hyperledger Fabric, Go chaincode, RabbitMQ, Redis, Socket.IO, React, HSM (PKCS#11), X.509, Hyperledger Caliper, AWS EC2, Go, Gin, Next.js, Java, TestNG, RestAssured, Selenium, Allure, TestRail]
plain: NCP lets merchants and their customers issue, trade and redeem digital tokens, with every movement recorded on a shared Hyperledger Fabric ledger. I built the gateway between the platform and the ledger. It gets transactions signed, endorsed and committed, and keeps them moving when other parts of the system fail.
links:
  - { label: "HSM integration with the Fabric Java SDK (Medium)", href: "https://medium.com/@zakariahossain/hsm-integration-with-hyperledger-fabric-java-sdk-bridging-the-security-gap-7910c0232150" }
diagram:
  caption: Users sign in the browser. The gateway takes the transaction through Fabric and tells merchants when it lands.
  stages:
    - title: User
      nodes:
        - { label: Signing portal, note: keys stay in browser, mine: true }
    - title: Gateway
      nodes:
        - { label: Token gateway, note: "Node.js, Express", mine: true }
        - { label: HSM crypto suite, note: X.509 identities, mine: true }
    - title: Delivery
      nodes:
        - { label: RabbitMQ retry table, note: replays after outages, mine: true }
        - { label: Socket.IO + Redis, note: several instances, mine: true }
    - title: Ledger
      nodes:
        - { label: Hyperledger Fabric, note: "endorse, then commit" }
        - { label: Go chaincode, note: "ERC-1155 tokens, escrow" }
    - title: Merchants
      nodes:
        - { label: Merchant callbacks, note: event listeners, mine: true }
---

## How it works

Users hold their own keys. In the React signing portal I built, a user generates an HD wallet (secp256r1) from a BIP39 recovery phrase in the browser and signs transactions there. The same phrase always gives back the same keys. The signed transaction goes to the token management gateway, a Node.js and Express service I owned, which takes it through Fabric endorsement and commit.

Organisations on the network have X.509 identities, and the gateway uses a custom crypto suite so those keys can live in a hardware security module. In late 2023 I added multi-tenancy to the gateway. Several tenants share one Fabric channel with separate chaincodes, each tenant registers its own clients and admins, and event listeners call each merchant's callback URL when their transactions land. I also built the PIN-reset email flow, with the emails in Korean and English.

The token logic is an ERC-1155 chaincode in Go. I added token details, paginated history and a permission matrix to it, and worked on escrow across the stack. In the gateway that meant the trade, redeem, refund, multilateral settlement, register and update-expiry flows, plus the checks around them: a merchant can't put another merchant's tokens into escrow, and an update-expiry release checks the balance and its expiry before it goes ahead. In the chaincode it meant escrow deposit and release.

The platform was built for KONA I, and I worked directly with the Korea team, in English, on requirements, demos and releases.

I also worked on KONA-SCAN, the platform's block explorer, with a Go and Gin backend and a Next.js frontend. I wrote its first block event listener, which teammates later rewrote, and the balance views for re-minted tokens and direct transfers. Most of the KONA-SCAN code today is my teammates' work.

## Key decisions

### Sign on the user's device

The gateway never sees a user's private key. It receives a signed transaction and handles the rest of the Fabric flow, so custody stays with the user.

### Don't lose messages when the broker goes down

If a RabbitMQ publish fails, the message goes into a retry table and replays once the broker is back. Pending messages are replayed for every tenant, and a row is marked done once its message has gone out, so it isn't sent again. A broker outage delays messages instead of dropping them.

### Run several gateways at once

A Redis-backed Socket.IO adapter lets several gateway instances run behind a load balancer, so the gateway can scale out without losing real-time events. Events pass through Redis, so one raised on one instance still reaches a client connected to another.

## Testing it

The platform had Java API and UI test automation (TestNG, RestAssured, Selenium and Allure), and I restructured it. I built a shared API library and base classes that the tests build on, so every test makes its requests the same way. API tests run data-driven request variations: one base request, then a list of changes to it, each checked on its own. I added test flows for buying and burning tokens and for escrow expiry, with assertions on the balances they leave behind, and kept the UI tests in step with a new frontend. I also wired the results into TestRail and posted each run's results to Microsoft Teams.

## What made it hard

Concurrency on Fabric. Endorsement failed when transactions arrived at the same time. On Fabric, several peers run the same chaincode and their results have to match. The chaincode stamped records with each peer's own clock, so two peers endorsing a moment apart wrote different timestamps, and the endorsement policy rejected the transaction. I switched it to the timestamp carried in the transaction itself, so every peer computes the same result, and fixed the gateway's own handling of concurrent transactions.

Proving it holds up. I benchmarked minting with Hyperledger Caliper in a test environment: 5,000 transactions with no failures, at about 150 to 170 TPS.

Running it. I wrote most of the Fabric operations scripts: upgrading chaincode one at a time or several in a batch, revoking certificates by pushing an updated revocation list into the channel config, tuning the block batch timeout, setting up HSM slots, and pulling block data and channel info. I wrote up the HSM side in more detail on Medium.
