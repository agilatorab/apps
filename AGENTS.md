# Agent guidance

This repository generates **apps.agilator.se** — a card per app, plus the
privacy policy and support page that each App Store listing points at.

Static HTML from a dependency-free Node generator, published to GitHub Pages.
There is no framework, no bundler and no lockfile; `node scripts/build.mjs` is
the whole build.

## Local working notes

**`PLAN.md` is untracked and may be present in a working copy.** It carries the
rollout plan and per-app status. Read it if it is there, and keep it current as
work lands — but it is local only: never commit it, and never copy its contents
into a tracked file, a commit message or a generated page.

## The one rule

**A generated page links to the App Store, to this site, to the company site
it belongs to (agilator.se), or to our contact address — and to nothing else.**

`scripts/check.mjs` enforces this as an allowlist over `dist/` and runs in CI
before publishing, so an unexpected destination fails the build. If a change
needs a new kind of destination, that is a decision to raise, not an allowlist
entry to add quietly.

## Layout

```
data/apps.js        every app as one row — the source of truth
data/brand.js       the mark and palette, imported from agilatorab/web
scripts/build.mjs   generates dist/
scripts/check.mjs   the link allowlist
scripts/import-brand.mjs  regenerates data/brand.js from a checkout of agilatorab/web
.github/workflows/pages.yml
CNAME               apps.agilator.se
```

Output is `dist/index.html` plus `dist/<slug>/privacy/` and
`dist/<slug>/support/` per app. `dist/` is build product — gitignored, never
edited by hand.

## The look

The palette and the mark come from the company site, [agilatorab/web](https://github.com/agilatorab/web),
so the two read as one company. `data/brand.js` is generated from that
checkout — `node scripts/import-brand.mjs ../web` — and never edited by hand.
When the brand changes there, regenerate it here in the same sitting.

## Changing an app

Edit its row in `data/apps.js` and rebuild. The policy and support prose are
generated from the row's fields, so the policies cannot drift apart:

| Field | Meaning |
| --- | --- |
| `slug` | the path on this site, and nothing else |
| `name` | the App Store name |
| `tagline` | one line, on the index card |
| `appStoreId` | numeric Apple ID; `null` renders "Coming soon" rather than a dead link |
| `sync` | cloud destinations the user may choose to connect; `[]` for none |
| `icloud` | the installed app can carry data between the user's own devices through their Apple Account |
| `localFolder` | the app can write to a folder the user picks |
| `selfHosted` | server software the user runs and points the app at — not an account with a provider |
| `gameCenter` | the app talks to Apple's Game Center: player, achievements, and scores a public board shows |
| `purchases` | the app sells something inside itself, through Apple |
| `encrypted` | the synced document is encrypted before it leaves the device |
| `health` | records health information — adds the sensitive-data and not-a-medical-device sections |
| `child` | that health data is about a child — adds the children's-data section |

**The rows must stay true.** These pages are what Apple reviews an app's
behaviour against. A policy claiming less collection than the app performs is a
compliance problem rather than a typo, so when an app gains a sync provider or
starts recording something new, its row changes in the same release.

Prose belongs in the generator, not in a row: a row states facts, and
`build.mjs` turns facts into sentences. If two apps would need genuinely
different wording for the same fact, that is a new field.

## Commands

```sh
make build     # generate dist/
make check     # build, then verify the link allowlist
make serve     # http://localhost:8000
```

Run `make check` before committing — it is what CI runs.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`). Say what changed and why the
shape is what it is; the diff already says what the lines are.
