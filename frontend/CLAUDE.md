# Frontend

React + TypeScript application built with [Vite](https://vitejs.dev/), [Mantine UI](https://mantine.dev/), and [TanStack Query](https://tanstack.com/query).

## Commands

```bash
yarn install        # Install dependencies
yarn dev            # Start dev server
yarn build          # Production build (tsc + vite build)
yarn test           # Run tests (vitest)
yarn test:ci        # Type-check + run tests
yarn lint           # ESLint
yarn format         # Prettier
```

Set `VITE_POCKETBASE_URL` to point at a running backend (defaults to the Vite dev server proxy if unset).

## Source Layout

```
src/
  main.tsx          # App entry point, providers setup
  App.tsx           # Root component with PocketBaseProvider
  Router.tsx        # React Router route definitions
  theme.ts          # Mantine theme customization
  components/       # Reusable UI components
  hooks/            # Data-fetching hooks (React Query) and auth
  lib/
    urls.ts         # Centralized route URL constants — use this for all navigation
    CommandMenuContext.tsx  # Spotlight/command menu state
  pages/            # One directory per route (Home, LinkViewer, Settings, etc.)
  types/            # TypeScript types matching PocketBase collection schemas
```

## Key Patterns

- **PocketBase access**: Always use the `usePocketBase()` hook to get the `pb` client and current `user`. Never instantiate `PocketBase` directly in components.
- **Auth guard**: Use `useRequireAuth()` in pages that require login — it redirects to `/login` if the session is invalid.
- **Data fetching**: All server state goes through TanStack Query. Hooks live in `src/hooks/`. Prefer adding a new hook file over fetching inline in components.
- **Navigation**: Import `URLS` from `@/lib/urls` for all route paths — never hardcode strings.
- **UI components**: Use Mantine components first. Custom components live in `src/components/`.

## Browser tests

`testing/` renders every route against a seeded database and screenshots it
(`cd testing && ./run.sh`). Add new routes to the `cases()` table in
`testing/tests/screenshots.spec.ts`.

## Collections / Data Model (key fields)

- **`links`**: `title`, `url`, `excerpt`, `summary`, `header_image_url`, `hostname`, `author`, `article_date`, `last_viewed_at`, `reading_progress`, `starred_at`, `archive`, `read_time_display`, `tags` (relation), `feed` (relation)
- **`tags`**: `name`, `user`
- **`feeds`**: `name`, `url`, `user`
- **`feed_items`**: intermediate records created on RSS fetch, converted to `links` asynchronously
