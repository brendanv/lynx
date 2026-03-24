# Backend

Go application built on [PocketBase](https://github.com/pocketbase/pocketbase). PocketBase handles auth, the SQLite database, file storage, and the admin UI. Custom logic hooks into PocketBase's event system.

## Commands

```bash
go build ./...          # Build
go test ./...           # Run tests
go run main.go serve    # Run dev server (port 8080)
```

Automigrate is enabled when running via `go run` (dev mode). To create a new migration, make schema changes via the PocketBase admin UI at `localhost:8080/_` and they will be written to `migrations/` automatically.

## Package Overview

- **`lynx/`** — Core application logic, registered in `main.go` via `lynx.InitializePocketbase(app)`.
  - **`lynx.go`** — Registers all routes, cron jobs, and PocketBase event hooks.
  - **`api_key_auth_middleware.go`** — Middleware that resolves `X-API-KEY` header to a user record, enabling programmatic access without session auth.
  - **`feeds/`** — RSS/Atom feed subscriptions. Fetches all feeds every 6 hours via cron. New feed items trigger a hook that converts them to link records.
  - **`url_parser/`** — Fetches a URL and extracts article content using `go-readability`. Called on `POST /lynx/parse_link`.
  - **`summarizer/`** — Calls OpenRouter to generate a summary for newly saved links. Runs asynchronously after link creation.
  - **`tagger/`** — Calls OpenRouter to suggest tags for newly saved links. Runs asynchronously after link creation.
  - **`singlefile/`** — Sends links to a `lynx-singlefile` container (headless Chrome) to create self-contained HTML archives. Runs asynchronously after link creation, or on-demand via `POST /lynx/link/{id}/create_archive`.
- **`migrations/`** — Auto-generated PocketBase migrations. Do not edit by hand.

## Key Patterns

- **Async work**: Use `routine.FireAndForget(func() { ... })` for background tasks (summarizing, archiving, tagging) triggered by PocketBase hooks.
- **Dependency injection for tests**: Interfaces like `Summarizer` allow replacing real implementations in tests (see `lynx_test.go`).
- **API key expiry**: Keys expire 6 months from creation; `expires_at` is checked on every request.
