---
title: "Reading Bangladeshi NID cards: OCR first, the expensive model only where it's unsure"
card: Reading Bangladeshi NID cards with OCR and an LLM
summary: Reads KYC fields from Bangladeshi NID cards in Bangla and English. Cloud Vision reads the text, a cheap Gemini model parses it, and a stronger one re-reads only the fields the rule checks doubt, from crops of the photo.
outcome: Double-sided cards that need a second look dropped from about 54 s to 32 s, and a clean card needs a single model call.
meta: Personal · OCR + LLMs · 2026
org: Personal project
years: "2026"
role: Solo
status: Working REST API and command-line tools
order: 9
featured: false
group: personal
published: 2026-10-09
stack: [TypeScript, Express, Google Cloud Vision, Gemini, Zod]
plain: To open an account, a bank or wallet needs the details printed on your national ID card, such as the number, your name, date of birth and address. This service reads them from a photo, in Bangla and English, and only pays for the expensive AI model on the parts of the card it isn't sure about.
diagram:
  caption: Every card gets cheap OCR and parsing. Only the fields the rules doubt go to the strong model, as crops.
  stages:
    - title: Input
      nodes:
        - { label: Card photos, note: "front, back or both" }
    - title: Read
      nodes:
        - { label: Cloud Vision OCR, note: "lines, boxes, confidence", mine: true }
    - title: Parse and check
      nodes:
        - { label: Lite parser, note: "cheap Gemini, text only", mine: true }
        - { label: Rule checks, note: "pass, verify or absent", mine: true }
    - title: Second look
      nodes:
        - { label: Field crops, note: glare and gap aware, mine: true }
        - { label: Pro re-read, note: doubtful fields only, mine: true }
    - title: Result
      nodes:
        - { label: Zod-checked JSON, note: "cost, timing, review", mine: true }
---

## How it works

The service is a TypeScript REST API on Express, plus command-line scripts. You send a photo of the front of a card, and the back if you have it. It returns the card's fields as JSON: from the front, the NID number, the holder's name in English and Bangla, the date of birth and the parents' names; from the back, the address, blood group and issue date. It knows three card types. Smart cards also carry a place of birth, temporary paper cards a validity date, and old laminated cards neither.

Every field comes back with a value, a confidence of high, low or unreadable, and a flag that says whether a person should check it.

There are several modes, from OCR only to a full double check where a Gemini model reads the whole card next to the OCR text. Smart mode, the tiered one, is meant for everyday use and works in five steps.

First, Google Cloud Vision reads each side, hinted to Bangla and English. I keep more than the text: every line comes with its position on the card and Cloud Vision's own confidence score.

Second, a cheap, fast Gemini model turns those lines into fields. It sees text only, never the image, and for each field it says which lines it used.

Third, rule checks in plain TypeScript look at every field. A smart card number must be 10 digits, while older cards allow 10, 13 or 17. Dates must be real dates. The blood group must be one of the eight valid values. Bangla fields must contain Bangla script. Fields a card type doesn't have should be empty.

Fourth, each field is routed on its own to pass, verify or absent. Fifth, only the verify fields go to a stronger Gemini model, which confirms or corrects them.

The result is checked against a Zod schema and carries timing for each step, the number of model calls, token usage and the card's cost. Card photos and outputs stay out of git.

## Key decisions

### Pay for the strong model only where it's needed

Most fields on a clean card are easy, and the strong model costs the most. So the cheap model parses everything, and the strong model only sees fields that failed a check, with a cap on how many one card can send. A clean card needs a single model call.

### Code decides what's doubtful, not the model

The parser can ask for a second look, but it can't wave a field through. A field passes only when the parser rates it high, doesn't ask for review, every rule check agrees, and Cloud Vision's confidence on the lines it came from is above a set threshold. A field that should be on the side you sent but came back empty is treated as a capture problem, such as flash or blur, and goes to verify. A field the card type doesn't have is marked absent.

### Crops, not just the whole card

Because Cloud Vision gives every line a position, each doubtful field can be cut out of the photo. The strong model still gets the full side for context, but each field it has to check also arrives as a crop of that spot, labelled with the reason it was flagged.

### The second look can't undo the first

The strong model returns a full result, but I only take its values for the fields it was asked to check. Everything that passed keeps the cheap model's value. Otherwise the strong model could blank out a field that was read clearly and never shown to it up close.

## What made it hard

Bangla OCR. Cloud Vision can split joined letters (conjuncts) into separate ones, drop small marks such as the nasal sign, put spaces inside words and mix up look-alike letters. I wrote repair rules for each of these into a shared prompt, so every mode fixes the text the same way. Smart cards add their own trouble: tiny labels sit right above values and get merged with them, the number is printed with spaces, and the machine-readable lines on the back must be ignored. Old laminated cards often need the second look, because old scans, the number in red ink and long Bangla addresses are harder to read.

Glare and missing text. A phone flash can wipe out part of a field, and OCR never sees what isn't there. The service looks for glare on each side, and when a field's box overlaps it, the crop is contrast-enhanced before the strong model sees it. It also looks for a label with an unusually wide gap before its value, a sign that glare may have erased the start of the value. That field goes to verify even if every other check passed, and the strong model gets three versions of the crop: the raw pixels, a high-contrast one and an inverted one.

Models that don't follow the format. Some models returned confidence words outside the allowed set, which broke the schema check, so values are normalised before the Zod parse. Flat or wrapped JSON are both accepted, and if the reply can't be parsed at all, every field goes to the strong model instead of the card failing.

One photo with both sides. When a single image shows the front and the back, the service spots markers from both sides in the OCR text and splits the lines by height, so routing still knows where each field is.

Speed. Double-sided cards that needed the second look took about 54 s. I started uploading the photos while OCR was still running, cropped each field before enhancing it so the image work runs on small pieces, prepared all the crops in parallel, and lowered the strong model's thinking level from high to medium. Those cards now take about 32 s.
