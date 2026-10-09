# xack20.github.io

The personal site of Zakaria Hossain Foysal, built with Astro and deployed to GitHub Pages by GitHub Actions.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run verify` | Type check, unit tests with coverage, build, content guards, end-to-end tests |
| `npm run cv -- <base CV .tex>` | Rebuild `public/cv.pdf` from the base CV, removing the phone number |
| `npm run og` | Re-render `public/og.png` |

## Content rules (enforced by `npm run guards`)

- No phone numbers or `tel:` links on the site or in the CV PDF.
- No ownership counts (for example "X of Y commits") anywhere.
- No internal names, ticket IDs, security-bug details or teammates' names on the site.
- No em dashes or stock marketing words in site copy.

The rules live in `scripts/guards/rules.mjs`, with tests in `tests/unit/guards.test.ts`.

## Where things live

- Case studies: `src/content/work/*.md` (frontmatter schema in `src/content.config.ts`).
- Everything else on the pages: `src/data/*.ts`.
- Lab logic: `src/lib/approval/ledger.ts`. Hero animation: `src/lib/constellation/sim.ts` and `src/scripts/constellation.ts`.
