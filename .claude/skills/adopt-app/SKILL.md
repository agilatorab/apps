---
name: adopt-app
description: Bring an app or a game up to the standard every listing on apps.agilator.se meets before submission — phone wrapper, desktop build, identity from the deployment, storage, store listing, privacy row — or verify one that claims to be there. Use when adding a new app to the site, when asked whether an app is "finished" or "ready to submit", or when auditing the fleet.
---

# Adopt an app

Every app and game listed on this site ships the same way. This skill is the
definition of "finished" and the order to get there in. It verifies first and
fixes second: nothing is ticked because it was probably done.

Start with the working notes in `ops/` at the root of this working copy — a
private companion repository this one ignores. If `ops/` is missing, clone it:

```sh
git clone git@github.com:agilatorab/apps-ops.git ops
```

Then:

- **Where things stand** — `python3.12 ops/registry.py status` for every app,
  `python3.12 ops/registry.py status <slug>` for one: what is done, what is
  left for an agent, what waits on the owner, and the latest comment. Start
  from that, not from memory.
- **The detail** — `ops/CHECKLIST.md`: how to verify each part, where each
  app's checkout is, and the helper scripts in `ops/adoption/` that do the
  mechanical work.

Commit and push in `ops/`; never copy its contents into a tracked file here, a
commit message or a generated page. If the clone fails for want of access,
carry on from the standard below and say so in the report.

## How to work

1. **Pull first.** Every checkout, `git pull`, before checking anything.
2. **Verify by exit code**, never by the last line of a command's output.
3. **Walk the sections below in order**, fixing as you go. A gap found in one
   app is often in its siblings — check them before moving on.
4. **One app per commit series**, conventional commits, a changeset for every
   user-visible change in the repo's own format.
5. **Before pushing**, scan the diff and the message for local paths and for
   anything the local notes say must stay local.
6. **After pushing**, confirm CI on that commit.
7. **Record it in the registry** before finishing: `registry.py set` each part
   you verified (a part is `done` only when checked, never because it was
   probably done earlier), and `registry.py comment <slug> "…" --by "<who>"` —
   **one** comment of at most 500 characters that replaces the last one: the
   status in a sentence and the next step. A new app starts with
   `registry.py add`. Run `registry.py check`, then commit and push `ops/`.

## The standard

### Repository
- The repository carries the **plain name** ("Calc"). The store name exists
  only as the `APP_DISPLAY_NAME` secret.
- **No store identifier is committed**, except the literals native code must
  read: the iCloud container, an App Group, an iCloud key-value store, an
  Android widget package — all on `se.agilator.*`. Everything else reads
  `APP_BUNDLE_ID` and falls back to `dev.local.<slug>`.
- Lint, tests, formatting, build and workflow lint pass; CI is green on `main`.
- Nothing left over from the repository a part was ported from.

### Storage
- This device: IndexedDB for documents; `localStorage` for settings only.
- Remote: **Dropbox**, and a picked **local folder** where the app has one. No
  Google Drive.
- Phone app: **iCloud Drive** for documents (tools and health apps) or
  **iCloud key-value storage** for small state (games, checklists). The shell
  injects it as a capability; the page asks whether it is present, never where
  it is running.
- Desktop app: Dropbox signs in through a **loopback redirect** — the page
  detects a desktop-shell origin and connects in place.

### Identity — one variable contract everywhere
- `APP_DISPLAY_NAME`, `APP_BUNDLE_ID`, `EAS_PROJECT_ID`, read from GitHub
  **secrets** (never variables) by every workflow, and set as EAS environment
  variables too.
- A production phone build throws without them; a release desktop package
  refuses the development identity (`--require-identity`).
- The desktop package merges the same two over its committed development
  identity at packaging time.

### Phone app (`native/`)
- A thin Expo wrapper: the built site in a WebView from a loopback origin on
  **the app's own port** (the allocation is listed in every
  `local-server.ts`; a new app takes the next free ten).
- The iCloud container is committed, never derived from the bundle id, and
  declared with `NSUbiquitousContainers` so it is visible in the Files app.
- A dispatch-only EAS build workflow, a typecheck job in CI, Makefile targets,
  generated icons, root tests that pin the bridge contract.

### Desktop app (`tauri/`)
- Tauri only. Two crates: `shell/` holds every decision and needs no GUI
  libraries; `src-tauri/` holds every effect.
- The site served from a private `<slug>://` scheme. The page is never told
  where it runs; the one seam is `VITE_SHELL_BUILD`, which leaves the service
  worker and the update prompt out.
- One capability a page cannot have: the **loopback OAuth listener** (ports
  53682–53684). The window **reopens where it was left**.
- The window background is the app's own dark surface; icons are RGBA with a
  DIB `.ico`.
- CI runs the decision tests, rustfmt, clippy at zero warnings and the effects
  tests. The release creates a draft, packages Windows, macOS and Linux, and
  publishes only once every installer is attached.

### Store listing (`native/store/`)
- Committed rules (`listing.mts`), a committed template for the words
  (`copy.example.mts`), and the real words gitignored (`copy.mts`).
- The age-rating questionnaire answered from what **the app itself provides**,
  every answer that is not NONE justified in a comment. Privacy and support
  URLs point at `apps.agilator.se/<slug>/`.
- `make store-metadata` runs; `make store-preflight` lists only work that needs
  the owner.

### Privacy
- An in-app privacy page is true for both the website and the app build, and
  links to `apps.agilator.se/<slug>/privacy/`.
- The app's row in `data/apps.js` is true. `icloud: true` is set **in the same
  release that ships the phone build**, because Apple reviews the build against
  these pages. Rebuild and run `make check`.

### Games, additionally
- Game Center, purchases and cloud save wired exactly as the row says; the
  cloud-save merge is deterministic.

### Health apps, additionally
- The row carries `health: true` (and `child: true` when the data is about a
  child). The app says it is not medical advice wherever it predicts or checks
  anything.

## What needs the owner

Registering identifiers, the Expo account, secrets, the Dropbox app's redirect
URIs (`http://127.0.0.1:53682/`, `:53683/`, `:53684/`), App Store records, the
App Privacy questionnaire, the listing copy and the review phone. List what is
outstanding; do not attempt any of it.

## Report

Keep the registry and the report in step — the comment you wrote is the
report's summary for that app. Per app: what was verified, what was fixed (with commit SHAs), what is
outstanding and for whom, and anything that has never been run end to end.
