# PocketBase upgrade plan: v0.28.2 → v0.40.2

Status: **executed**. The upgrade landed in the commit following this document;
what remains open is the production rollout in step 5, which is a human
operation. Every claim below marked "verified" was reproduced against this repo.

Results of the verification gate (step 4), run against the real branch:

- `go build ./...`, `go vet ./...`, `go test ./...` — all clean.
- `yarn`/`npm` `format:check`, `lint`, `test:ci` (tsc + vitest), `build` — all clean.
- `testing/run.sh` browser suite — **86/86 passed**, every route rendered in
  desktop-light, desktop-dark and mobile-light with no console errors.
- A v0.28-seeded `pb_data` migrated with the new binary: 17 -> 19 `_migrations`
  rows, all 26 links intact, and the server then served the API normally.
- `POST /lynx/parse_link` against a live URL produced a correct title, hostname
  and read time; `POST /lynx/parse_feed` against a live RSS feed ingested 20
  items, so the `feed_items` create hook fires under v0.40 too.

Not exercised here, still on the manual list before production: SingleFile
archiving (needs the SingleFile container), and summarization and tag
suggestion (need OpenRouter credentials).

Two things deliberately left alone, both pre-existing and out of scope:

- `pb.authStore.model` (`useLinksFeedQuery.tsx`) and `pb.files.getUrl`
  (`ArchiveViewer.tsx`) are deprecated SDK aliases. Both still exist in 0.28 and
  work; migrating them to `.record` and `.getURL()` is a separate cleanup.
- `frontend/package.json` declares `packageManager: yarn@4.5.0`, but the
  committed `yarn.lock` is yarn v1 format and CI installs with `npm ci`. This
  means a plain `yarn install` fails without corepack.

## Summary

- Backend goes from `github.com/pocketbase/pocketbase` **v0.28.2 → v0.40.2** (12 minor releases).
- The upgrade **compiles, vets, and passes `go test ./...` with zero source changes** (verified).
- The only mandatory code-adjacent work is **toolchain**: PocketBase v0.40 requires **Go 1.27.0**
  (we are on 1.24, and CI is pinned to 1.21.x). This drives changes to `go.mod`, the `Dockerfile`,
  and `.github/workflows/backend-tests.yml`.
- Frontend `pocketbase` JS SDK goes **^0.26.0 → ^0.28.0**; the intervening changelog is additive
  plus bug fixes, with no breaking API changes.
- Recommendation: **one single jump**, not a staged 0.29→0.30→… walk. The staged walk costs ~12
  build/test cycles and buys nothing here, because the trial jump was clean and every ⚠️ item in
  the changelogs was checked individually (see below).

## Evidence from the trial run

A copy of `backend/` was upgraded in a scratch directory and exercised:

| Check | Result |
|---|---|
| `go get pocketbase@v0.40.2` + `go build ./...` | clean, no source edits |
| `go vet ./...` | clean |
| `go test ./...` | all packages pass |
| `go run ./cmd/seed --reset` (fresh DB under v0.40) | seeds 26 links / 7 tags / 3 feeds |
| `migrate up` over a v0.28-seeded `pb_data` | applies 2 new system migrations, 17 → 19 rows in `_migrations` |
| `serve` on the migrated DB: health, password auth, record list with `expand` | identical to v0.28 |
| All five frontend relation filters (see below) | identical `totalItems` on v0.28 and v0.40 |
| `/lynx/generate_api_key`, `X-API-KEY` auth on `/lynx/parse_link`, expired-key rejection | identical status codes and payloads |

The two system migrations that get applied to existing databases are
`1763020353_update_default_auth_alert_templates.go` and `1778828400_normalize_indexes.go`
(the latter resaves all collections so indexes are normalized into `Collection.Indexes`).

## Breaking changes reviewed, and why each is or isn't a problem for Lynx

Every ⚠️ entry in the PocketBase changelog between v0.29.0 and v0.40.2:

| Release | Change | Impact on Lynx |
|---|---|---|
| v0.30.0 | Min Go raised to 1.24.0 | Superseded by the v0.40 bump to 1.27. |
| v0.30.1 | `lost+found` excluded from backups | None; we don't customize `OnBackupCreate`. |
| v0.31.0 | Client-side filter/sort blocked through relations whose target collection is superusers-only | **Checked.** All Lynx collections have `listRule: "user = @request.auth.id"`. The only null-rule collection in the snapshot is the system `_superusers`, which nothing relates to. |
| v0.32.0 | Extends the same rule to *every* relation in a filter chain, not just the last | **Checked and verified empirically.** The five filters `buildFilters()` emits — `tags.id`, `suggested_tags.id`, `created_from_feed.id`, `highlights_via_link.id`, and `last_viewed_at` — all return identical counts on v0.28 and v0.40. |
| v0.33.0 | Stricter record `id` character validation; `mails.SendRecordAuthAlert` gains a 3rd arg | We don't call `SendRecordAuthAlert`. Seeded/real ids are alphanumeric. Worth a sanity check that no production ids contain `. / \ : ? * % $` or are reserved Windows names — see step 2. |
| v0.36.0 | `search.ResolverResult`: `NoCoalesce` → `NullFallback`, `MultiMatchSubQuery` concretized | Internal API; Lynx doesn't use `search`. |
| v0.37.0 | Dashboard UI rewritten; `/_/images/oauth2/*` logo paths soft-deprecated | Lynx serves its own SPA and doesn't reference dashboard assets. Cosmetic change for admins only. |
| v0.38.1 | Migration resaves all collections to normalize indexes | Applies automatically; verified against a v0.28 database. |
| v0.40.0 | Console command errors and panics now propagate to a non-zero exit code | **Behavioral.** Nothing in our `Dockerfile` or `run.sh` chains PocketBase commands with `&&`, so no change needed — but do not add such a chain assuming exit 0. |
| v0.40.0 | Go 1.27 + `encoding/json/v2` | Main risk area, see below. |

### The `encoding/json/v2` change (v0.40.0)

Go 1.27 retrofits `encoding/json` onto v2 and is **not fully backward compatible**; upstream
explicitly warns against pushing this to production untested.

One observable difference already confirmed here: **map keys are no longer serialized in
alphabetical order.** `/lynx/generate_api_key` returns `{"name",...,"api_key",...}` on v0.40 versus
`{"api_key",...,"name",...}` on v0.28. This is harmless for JSON consumers, and our Go tests use
substring `ExpectedContent` assertions on individual `"key":"value"` pairs rather than whole-body
equality, so nothing breaks — but it would break any future golden-file test.

Upstream also shipped v0.40.1 specifically to fix two json/v2 regressions (invalid UTF-8 mangling,
OAuth2 provider config merging). Pin **v0.40.2 or later**, never v0.40.0.

## Plan

### 1. Toolchain (do first, it is the actual blocker)

- `backend/go.mod`: `go 1.24` → `go 1.27`, `toolchain go1.24.0` → `toolchain go1.27.1`.
- `Dockerfile`: `FROM golang:1.24 AS backend-builder` → `golang:1.27` (tag exists on Docker Hub;
  `CGO_ENABLED=0` + `alpine:3.20` runtime stay as-is).
- `.github/workflows/backend-tests.yml`: `go-version: '1.21.x'` → `'1.27.x'`. While in the file,
  bump `actions/checkout@v3` → `@v4` and `actions/setup-go@v4` → `@v6` (upstream notes the v5 Go
  source is no longer reachable).
- Anyone building locally needs Go 1.27, or `GOTOOLCHAIN=auto` so the toolchain self-downloads
  (verified working).

### 2. Backend dependency bump

```sh
cd backend
go get github.com/pocketbase/pocketbase@v0.40.2
go mod tidy
```

Expected transitive moves (verified): `pocketbase/dbx` 1.11.0 → 1.12.0, `modernc.org/sqlite`
1.37.1 → 1.57.0 (SQLite 3.51.x, and v0.40 enables SQLite defensive mode via `_defensive=1`),
`golang-jwt/jwt/v5` 5.2.2 → 5.3.1, all `golang.org/x/*` forward, and
`go-ozzo/ozzo-validation/v4` replaced by the fork `pocketbase/ozzo-validation/v4`.

Housekeeping while here: `github.com/labstack/echo/v5` is still a **direct** requirement but is
only used in `backend/lynx/url_parser/url_parser_test.go` for two constants
(`echo.HeaderContentType`, `echo.MIMEApplicationForm`). PocketBase dropped Echo back in v0.23.
Replace those with `"Content-Type"` / `"application/x-www-form-urlencoded"` and drop the dependency.

Sanity check on ids before deploying to a real database (v0.33 validation):

```sql
-- run against a copy of production pb_data; expect zero rows
SELECT id FROM links   WHERE id GLOB '*[./\|"<>:?*%$ ]*';
SELECT id FROM users   WHERE id GLOB '*[./\|"<>:?*%$ ]*';
```

Note this only affects *new* writes — existing rows are not re-validated — so a hit here is a
warning about future record creation, not a blocker.

### 3. Frontend SDK bump

```sh
cd frontend
yarn up pocketbase@^0.28.0   # or edit package.json + yarn install
yarn test:ci && yarn lint && yarn build
```

Changelog 0.26 → 0.28 is additive (`pb.sql.run`, `pb.logs.truncate`, v0.37 collection meta
handlers) plus fixes (Safari/React Native abort detection, `pb.filter()` param edge cases,
realtime subscribe race). The one behavior change to be aware of: `getFullList()` default batch
size moved 200 → 1000, which only affects request shape, not results.

### 4. Verification gate

Run all of these before merging:

```sh
cd backend  && go build ./... && go vet ./... && go test ./...
cd frontend && yarn test:ci && yarn lint && yarn build
cd testing  && ./run.sh                       # seeds, serves, renders every page, screenshots
```

`testing/run.sh` is the highest-value check here — it exercises every route against a real server
with real data and fails on console errors, which is exactly where a json/v2 or API-rule
regression would surface. Diff the resulting `testing/screenshots/` against a set captured on
`main` before the bump.

Then manually exercise what the automated suite doesn't cover, because these hit the network and
the LLM providers:

- `POST /lynx/parse_link` with a real URL (go-readability path).
- `POST /lynx/parse_feed` + let `FetchFeeds` run, or trigger feed ingestion manually.
- SingleFile archiving, if a SingleFile container is available.
- Summarization and tag suggestion via OpenRouter.
- `X-API-KEY` auth against a real key.

### 5. Production rollout

1. **Back up `pb_data` first**, with the server stopped or via the dashboard backup feature. The
   v0.38.1 index-normalization migration rewrites every collection record; a v0.40 database is not
   readable by a v0.28 binary, so the backup *is* the rollback.
2. Restore that backup into a staging directory and run `./lynxapp migrate up --dir=/path/to/copy`
   against it with the new binary. Confirm it completes and the app serves. (Verified working
   against a v0.28-seeded database.)
3. Deploy the new image, let migrations run on start, and watch the logs for migration output and
   for any 400s on list requests (the v0.31/v0.32 filter tightening would show up there).
4. Rollback path: stop the container, restore the pre-upgrade `pb_data`, redeploy the previous
   image tag. Cheap and complete, which is why step 1 is non-negotiable.

### 6. Optional follow-ups (do not bundle with the upgrade)

- `go build -tags no_ui` (v0.37) drops the bundled dashboard from the binary. Attractive for image
  size, but Lynx has no other admin surface — only take it if you're prepared to lose the dashboard.
- New in v0.38: superuser IP/CIDR whitelist, rate-limit IP exclusions.
- New in v0.39: SQL console under Settings > Debug.
- New in v0.40: `DELETE /api/logs`, a max `Log.Data` size setting (~16KB default).

## Risk assessment

**Low**, with one caveat. The code surface Lynx touches (`core.App`, `apis`, hooks, `Cron`,
`routine`, `filesystem.NewFileFromBytes`, `security.RandomString`) is stable across the whole
range, and the trial upgrade needed no source changes at all. The caveat is Go 1.27's
`encoding/json/v2`: it is new, upstream shipped a same-week patch release for regressions in it,
and its failure mode is subtle serialization differences rather than compile errors. That is what
step 4's full browser suite and step 5's staging replay are for.
