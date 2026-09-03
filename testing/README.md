# Testing Lynx with seeded data and browser screenshots

Two pieces live here:

1. **A seeder** (`backend/cmd/seed`) that fills a PocketBase database with a
   realistic, deterministic library: users, tags, feeds, feed items, links in
   every display state, stored articles, offline archives, cookies and API keys.
2. **A Playwright suite** (this directory) that signs in as the seeded user,
   visits every route, asserts the page actually rendered, and saves a
   screenshot of each one.

Together they answer "does the app still render correctly?" without needing an
account, network access, or an LLM key.

## Quick start

```bash
cd testing
./run.sh
```

That seeds a throwaway database, starts the backend and the Vite dev server,
runs the suite in three configurations (desktop light, desktop dark, mobile),
and writes screenshots to `testing/screenshots/<project>/`.

```bash
./run.sh --no-seed                  # reuse the database from the last run
./run.sh --project=desktop-light    # one configuration only (fastest)
./run.sh --project=desktop-light -g link-viewer   # one page
npm run report                      # open the HTML report with every screenshot
```

First run only: `npm install` (done automatically by `run.sh`) and, if
Playwright has not downloaded a browser on this machine yet,
`npm run install-browser`.

`run.sh` starts the backend and the Vite dev server itself. If something is
already listening on the backend port it refuses to run, because Playwright
would reuse that server and the tests would silently read a different database.
Stop it, or pass `--no-seed` to test against it deliberately.

Other scripts: `npm run typecheck`, `npm run format`, `npm run format:check`.

## Seeding on its own

The seeder is a normal Go program that opens the database directly — it never
starts a server, and it does not trigger the summarize / archive / tag hooks, so
it makes no outbound network calls.

```bash
cd backend
go run ./cmd/seed --reset --dir ./pb_test_data   # what run.sh uses
go run ./cmd/seed --reset                        # seed ./pb_data for manual dev
go run ./cmd/seed                                # update in place, keep other data
go run main.go serve --dir ./pb_test_data        # then browse it yourself
```

Flags: `--dir`, `--public-dir`, `--base-url`, `--manifest`, `--reset`,
`--skip-images`, `--quiet`.

### Logins

| Who | Username | Password |
| --- | --- | --- |
| PocketBase superuser | `admin@lynx.test` | `lynxtestadmin` |
| Primary test user | `demo` | `lynxtestuser` |
| Second user (isolation checks) | `second` | `lynxtestuser` |

These are throwaway credentials for local databases only.

### What gets seeded

- **24 links** for `demo`, more than one page (the feed paginates at 18), and 2
  for `second` so tests can prove links do not leak across users. Between them
  they cover: read and unread, starred, summarized, tagged, LLM-suggested tags,
  saved from a feed, partially read, fully read, archived, no author, no
  article body, very long titles, and URLs with tracking parameters.
- **Article bodies** with headings, lists, blockquotes, code blocks, tables and
  figures, so the reader view is exercised properly.
- **3 feeds** (one auto-adding, one never fetched) and 18 feed items, some
  already saved to the library.
- **7 tags**, including one attached to nothing.
- **2 API keys** (one valid, one expired) and **2 saved cookies**.
- **Offline archives** on three links: complete self-contained HTML documents,
  so `/link/:id/archive` renders with no network access.
- **Header images**: small SVGs written to `backend/pb_public/seed-images/` and
  served by the backend itself. Nothing loads from the internet.

Record IDs are fixed (`lynxseedlink001`, `lynxseedfeed001`, …) so URLs stay
stable between runs. The seeder also writes `seed-manifest.json` into the data
directory; the tests read it instead of hardcoding IDs, so changing the fixtures
does not break the specs.

Re-running the seeder without `--reset` updates the seeded records in place and
leaves anything else in the database alone.

## What the browser suite checks

`tests/screenshots.spec.ts` walks every route:

| | |
| --- | --- |
| `login` | signed out, plus the redirect from `/` |
| `home-feed` and 6 variants | unread, starred, search, by tag, by feed, page 2 |
| `link-viewer` | stored article with highlights |
| `link-edit`, `link-archive`, `add-link` | |
| `highlights`, `feed-items` | |
| `settings-*` | general, tags, feeds, cookies, api keys, import |

Each page must show its content and set its document title, and **must not log
anything to `console.error` or throw** — that check is what makes a screenshot
meaningful rather than decorative. A short allowlist of known-harmless warnings
lives at the top of `lib/test.ts`.

`tests/seed-data.spec.ts` asserts the data reaches the UI correctly: pagination
counts, per-user isolation, the unread/starred/search filters, a rendered
article and its archive, and the highlights.

### Highlights are created through the UI

A highlight stores a serialized DOM range, which only means anything against the
rendered page, so it cannot be seeded from Go. `tests/auth.setup.ts` creates
them the way a person does — selecting text in an article and saving it — which
keeps the highlight flow itself under test. It clears existing highlights first,
so the suite is repeatable.

## Layout

```
testing/
  run.sh                   one command: seed, serve, test, screenshot
  playwright.config.ts     projects, and the backend + frontend dev servers
  lib/env.ts               ports, paths, and the env vars that override them
  lib/manifest.ts          typed reader for seed-manifest.json
  lib/test.ts              fixtures: console-error capture, screenshots, theme
  tests/auth.setup.ts      signs in once, creates highlights
  tests/screenshots.spec.ts   every route, rendered and captured
  tests/seed-data.spec.ts     the data behind those pages
  screenshots/             output (gitignored)
```

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `LYNX_BACKEND_PORT` | `8090` | backend port |
| `LYNX_FRONTEND_PORT` | `5273` | Vite port (not the usual 5173, so it does not collide with a dev server you already have running) |
| `LYNX_SEED_DATA_DIR` | `./pb_test_data` | data directory, relative to `backend/` |
| `LYNX_SCREENSHOT_DIR` | `testing/screenshots` | where screenshots are written |
| `CI` | unset | set it to make Playwright start its own servers rather than reusing running ones, and retry once |

## Notes

- All signed-in tests share one browser page per worker. Vite serves the app as
  several hundred unbundled `no-cache` modules, so opening a fresh page costs
  about ten seconds while navigating an existing one costs about one. Each test
  still starts with its own `page.goto`, so nothing carries over but the
  session. This is worth roughly 3x on the whole suite.
- Screenshots are artifacts, not assertions — there is no pixel comparison,
  because font rendering differs between machines. Look at them, or diff them
  yourself between two runs on the same machine.
- Nothing here talks to OpenRouter, SingleFile or any external host. The seeded
  user settings deliberately have an empty API key.
