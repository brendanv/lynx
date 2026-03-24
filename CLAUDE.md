# Lynx - Claude Code Guide

Lynx is a self-hostable read-it-later service. The repo has two main components:

- **Backend**: Go + [PocketBase](https://github.com/pocketbase/pocketbase) (`backend/`)
- **Frontend**: React + TypeScript + [Mantine UI](https://mantine.dev/) + Vite (`frontend/`)

## Project Structure

```
backend/        # Go backend (PocketBase-based)
  main.go       # Entry point
  lynx/         # Application logic (hooks, routes, etc.)
  migrations/   # PocketBase DB migrations
frontend/       # React/TypeScript frontend
  src/          # Source files
  public/       # Static assets
resources/      # Docker configs, screenshots, logos
```

## Development Commands

### Backend
```bash
cd backend
go build ./...          # Build
go test ./...           # Run tests
go run main.go serve    # Run dev server (default port 8080)
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
- The frontend communicates with PocketBase via the `pocketbase` JS SDK.
- Article parsing uses `go-readability`; RSS ingestion uses `gofeed`.
- An optional SingleFile integration enables full-page archiving via a separate container.

## Testing

- Backend: standard Go tests (`go test ./...`)
- Frontend: Vitest (`yarn test` or `yarn test:ci`)
- CI runs both via GitHub Actions (`.github/workflows/`)
