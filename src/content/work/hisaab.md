---
title: "Hisaab: a finance app that keeps your data yours"
card: "Hisaab: a finance app that keeps your data yours"
summary: Reads bKash, Nagad and bank SMS, encrypts everything end to end, and runs its AI on the phone.
outcome: A budget that fills itself in from payment SMS, without your data leaving your devices unless you say so.
meta: Personal · Kotlin Multiplatform · 2026
org: Personal project
years: 2026 – now
role: Solo. Design, code and tests.
status: In progress, early stage
order: 10
group: personal
published: 2026-10-09
stack: [Kotlin Multiplatform, Compose Multiplatform, Swift, SQLDelight, SQLCipher, libsodium, Supabase, MediaPipe, Apple Foundation Models]
plain: Hisaab reads the payment messages you already get from bKash, Nagad, Rocket and your bank, and turns them into a budget without any typing. Everything is encrypted on your phone, and the AI runs on the phone too, unless you choose a cloud model and agree to send masked data.
links:
  - { label: "Public repo (behind my local build)", href: "https://github.com/xack20/finance-app" }
diagram:
  caption: The work happens on your devices. The SMS relay only sees ciphertext, and a cloud model is optional and only sees masked data.
  stages:
    - title: Capture
      nodes:
        - { label: Payment SMS, note: "bKash, Nagad, banks", mine: true }
        - { label: Voice and email, note: "Bangla voice, IMAP", mine: true }
        - { label: Mac companion, note: relays iPhone SMS, mine: true }
    - title: Parse
      nodes:
        - { label: Provider parsers, note: Bangla digits too, mine: true }
    - title: Store
      nodes:
        - { label: Encrypted ledger, note: SQLCipher + libsodium, mine: true }
    - title: Think
      nodes:
        - { label: On-device model, note: "Gemma, Apple models", mine: true }
        - { label: Cloud model, note: "your key, masked data", mine: true }
    - title: You
      nodes:
        - { label: Budget and agent, note: all-or-nothing changes, mine: true }
---

## How it works

Hisaab is a Kotlin Multiplatform app with a Compose Multiplatform UI, so Android and iOS share one codebase. It captures transactions from the SMS of six Bangladeshi providers (bKash, Nagad, Rocket, City Bank, BRAC Bank and DBBL), including amounts written in Bangla numerals. On Android it can also read payment notifications, once you switch that on and grant access.

You can add spending by voice too. It's push-to-talk, and the recognizer runs in Bangla using the Bangladeshi Bangla locale (bn-BD). Or you can let it read bank emails over IMAP, including a backfill of the last 12 months that asks the mail server for financial mail only.

iOS doesn't let apps read SMS, so there's a Mac companion app. When your iPhone forwards its texts to your Mac, the companion reads them there, encrypts each payment SMS and relays it to your phone, which parses it like any other SMS.

The ledger behind it covers accounts and credit cards, with each card's limit, statement day and due day, so the app can show what's outstanding and when the next payment is due. A transfer between your own accounts is saved as a matching pair of entries, and money you lend or borrow is tracked per person. The interface is a dark design system I built for the app, with text contrast checked against WCAG AA and animations that respect the phone's reduce-motion setting.

There's a conversational agent too. It can read your ledger and change it: set a budget, recategorise, or split a transaction. Its changes appear on a review card you can edit, and nothing is saved until you tap Apply. Then the whole set is saved together or not at all.

The public repo is behind my local build. The Mac companion and the email capture are in my local build but aren't in the public repo yet, and the public main branch doesn't have the voice screen or the Apple on-device model either.

## Key decisions

### Local first, encrypted by default

The database is encrypted with SQLCipher. Keys come from libsodium (Argon2id for key derivation, XChaCha20-Poly1305 for encryption), you get a BIP39 recovery phrase, and a biometric lock guards the app.

### On-device AI first

One provider interface hides where the model runs. On Android it's Gemma through MediaPipe. On iOS it's Apple's Foundation Models through a Swift bridge, which needs no API key. A cloud model is used instead only if you've set one up or Apple's model isn't available. If you want a stronger model you can bring your own Claude, Gemini or OpenAI key. Personal data is masked before anything leaves the phone, and only after you've agreed to it.

### The relay can't read what it carries

The Mac companion needs a server in the middle, so I made that server blind. The Mac and the phone each derive the relay key from your recovery phrase, and the Mac never stores the phrase. The server only ever holds a nonce and ciphertext, each row is readable by its owner only, and the phone deletes each row once it has taken it in.

### The same safety rules as at work

The agent can change your money data, so it gets the same treatment as the bank assistant I build at work. It proposes; you approve. Changes are saved all at once or not at all, and nothing goes to a cloud model without consent.

## What made it hard

Every provider formats its SMS differently, and some write amounts in Bangla digits, so parsing is per provider and covered by tests.

Getting SMS off an iPhone at all, which is what the Mac companion is for. It keeps a cursor of the last message it sent, and the cursor moves only after an upload succeeds, so a dropped connection can't skip a message.

Big mailboxes. A full inbox holds far more than payment mail, so the email backfill pages through results and filters on the mail server instead of downloading everything first.



Keeping it working while it changes fast. My local build has 438 tests across parsing, the ledger, the agent and the crypto.
