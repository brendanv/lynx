---
name: lynx-test-data
description: Seed Lynx with realistic test data and render its pages in a browser to check they still look right. Use when asked to populate test/demo data, run the browser tests, screenshot a page or the whole app, verify a UI change renders, or reproduce a rendering bug with real-looking links, feeds, tags, highlights or archives.
---

# Lynx test data and page screenshots

Everything lives in `testing/` (browser suite) and `backend/cmd/seed` (data).
Read `testing/README.md` for the full picture; this is the short version.

## Seed a database

```bash
cd backend
go run ./cmd/seed --reset --dir ./pb_test_data   # database the test suite uses
go run ./cmd/seed --reset                        # ./pb_data, for poking around by hand
```

Deterministic: fixed record IDs, 24 links for the `demo` user covering every
display state (read/unread, starred, summarized, suggested tags, from a feed,
partially read, archived, missing metadata), plus feeds, feed items, tags,
cookies, API keys and locally served header images. No network calls, no hooks
fire. IDs are written to `<data-dir>/seed-manifest.json`.

Logins: superuser `admin@lynx.test` / `lynxtestadmin`; app user `demo` /
`lynxtestuser` (and `second` / `lynxtestuser` for isolation checks).

To edit the fixtures, change `backend/cmd/seed/fixtures.go` (records) or
`articles.go` (article bodies), then re-run with `--reset`.

## Render every page and screenshot it

```bash
cd testing
./run.sh                                        # seed + all three viewports
./run.sh --no-seed --project=desktop-light      # fastest full pass
./run.sh --no-seed --project=desktop-light -g link-viewer   # one page
```

Screenshots land in `testing/screenshots/<project>/<page>.png`; `npm run report`
opens the HTML report with all of them attached. Projects are `desktop-light`,
`desktop-dark` and `mobile-light`.

`run.sh` starts the backend and the Vite dev server itself. Do not start them
separately first — Playwright reuses a server it finds on the port, which would
point the tests at a different database.

## When checking a UI change

1. Reseed only if you changed the fixtures or the schema.
2. Run the project that matches what you changed (dark-mode work →
   `--project=desktop-dark`; responsive work → `--project=mobile-light`).
3. Read the screenshots. There is no pixel diffing — the automated check is
   that each page renders its content, sets its title, and logs nothing to
   `console.error`.

## Adding a page to the suite

Add an entry to the `cases()` table in `testing/tests/screenshots.spec.ts` with
a `ready()` assertion for the content that proves the route rendered. Take IDs
from `lib/manifest.ts` helpers rather than hardcoding them.

If a page needs a state the seeder cannot produce (anything that stores a
serialized DOM range, for example), create it through the UI in
`tests/auth.setup.ts` the way highlights are created there.
