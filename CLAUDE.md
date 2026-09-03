# Lynx - Claude Code Guide

Lynx is a self-hostable read-it-later service. The repo has two main components:

- **Backend**: Go + [PocketBase](https://github.com/pocketbase/pocketbase) (`backend/`)
- **Frontend**: React + TypeScript + [Mantine UI](https://mantine.dev/) + Vite (`frontend/`)

## Project Structure

```
backend/        # Go backend (PocketBase-based)
  main.go       # Entry point
  lynx/         # Application logic (hooks, routes, middleware)
    feeds/      # RSS feed fetching and ingestion
    singlefile/ # SingleFile archive integration
    summarizer/ # LLM summarization via OpenRouter
    tagger/     # LLM tag suggestions via OpenRouter
    url_parser/ # Article parsing and saving
  migrations/   # PocketBase DB migrations (auto-generated)
frontend/       # React/TypeScript frontend
  src/
    components/ # Reusable UI components
    hooks/      # React Query hooks and PocketBase auth
    lib/        # Shared utilities (URL constants, contexts)
    pages/      # Route-level page components
    types/      # TypeScript types for PocketBase records
resources/      # Docker configs, screenshots, logos
```

## Development Commands

### Backend
```bash
cd backend
go build ./...          # Build
go test ./...           # Run tests
go run main.go serve    # Run dev server (default port 8090)
```

### Frontend
```bash
cd frontend
yarn install            # Install dependencies
yarn dev                # Start dev server
yarn build              # Production build
yarn test               # Run tests (vitest)
yarn test:ci            # Type-check + run tests
yarn lint               # Lint
yarn format             # Format with prettier
```

## Architecture Notes

- The backend uses PocketBase as the database/auth layer (SQLite-backed).
- Custom Go logic lives in `backend/lynx/` and hooks into PocketBase's event system.
- On link creation, three async tasks fire: summarization, SingleFile archiving, and tag suggestion.
- Feeds are fetched on a 6-hour cron schedule (`FetchFeeds`).
- API authentication supports both PocketBase session tokens and custom API keys via `X-API-KEY` header (keys stored in `api_keys` collection, expire after 6 months).
- The frontend communicates with PocketBase via the `pocketbase` JS SDK.
- `VITE_POCKETBASE_URL` env var controls which PocketBase instance the frontend connects to.
- Article parsing uses `go-readability`; RSS ingestion uses `gofeed`.
- An optional SingleFile integration enables full-page archiving via a separate container.

## Custom API Endpoints

All endpoints require authentication (session or API key).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/lynx/parse_link` | Save a new link by URL |
| POST | `/lynx/parse_feed` | Add an RSS feed |
| POST | `/lynx/generate_api_key` | Create a new API key |
| POST | `/lynx/link/{id}/create_archive` | Trigger SingleFile archive for a link |

## Testing

- Backend: standard Go tests (`go test ./...`)
- Frontend: Vitest (`yarn test` or `yarn test:ci`)
- CI runs both via GitHub Actions (`.github/workflows/`)

### Test data and page screenshots

`backend/cmd/seed` fills a PocketBase database with a deterministic library
(users, tags, feeds, feed items, links in every display state, stored articles,
offline archives, cookies, API keys). It writes to the database directly, so no
server is needed and none of the async hooks fire.

`testing/` is a Playwright suite that signs in as the seeded user, renders every
route, asserts it produced content and no console errors, and saves a screenshot
of each page in light, dark and mobile.

```bash
cd backend && go run ./cmd/seed --reset      # seed ./pb_data for manual dev
cd testing && ./run.sh                       # seed, serve, render, screenshot
```

Screenshots land in `testing/screenshots/`. See `testing/README.md` for the
fixtures, logins and options.
