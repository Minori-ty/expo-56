# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Anime tracking app (追番管理) built with Expo SDK 56, using file-based routing via expo-router. Tracks anime airing schedules, manages follow lists, and syncs calendar events for episode reminders.

## Essential commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run web            # Run in web browser
npm run lint           # Oxlint (no auto-fix)
npm run lint:fix       # Oxlint with auto-fix
npm run format         # Oxfmt formatter
npm run format:check   # Oxfmt check only
npm test               # Run all Vitest tests
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run check          # TypeScript type-check (tsc --noEmit)
npm run db             # Generate Drizzle migration files
```

## Architecture

### Routing (expo-router, file-based)

- `src/app/_layout.tsx` — Root layout: Drizzle migrations, fonts, providers (QueryClient, GestureHandler, BottomSheet, Keyboard, ErrorBoundary), calendar permission request, orphaned calendar event cleanup.
- `src/app/(tabs)/_layout.tsx` — Tab navigator with three tabs: Schedule (index), My Follows, Data Management.
- `src/app/(tabs)/index.tsx` — Weekly schedule view with per-weekday tabs (TabView), live-queried from anime table.
- `src/app/(tabs)/my-follows.tsx` — Full anime list grouped by status, with search, sort, delete.
- `src/app/(tabs)/data-management.tsx` — Export/import JSON, bulk calendar management.
- `src/app/animeDetail/[id].tsx` — Detail page with calendar integration, progress bar, episode calendar.
- `src/app/addAnime/index.tsx`, `src/app/editAnime/[id].tsx` — Add/edit forms using the shared AnimeForm component.

### Database layer

- **SQLite** via `expo-sqlite` with **Drizzle ORM** (`drizzle-orm/expo-sqlite`).
- `src/db/schema.ts` — Two tables: `animeTable` (anime metadata) and `settingsTable` (key-value store).
- `src/db/index.ts` — Exports the drizzle instance (`db`) and expo database handle (`expo`).
- Timestamps in DB are **unix seconds**; the API layer (`parseAnimeData`) converts to **milliseconds** for the rest of the app. Be careful with import/export round-trips: JSON exports are seconds, imports must `×1000` to restore ms.
- Drizzle Kit config at `drizzle.config.ts`, migration output in `drizzle/`.

### API normalization layer (`src/api/`)

- `src/api/anime.ts` — Raw DB CRUD (add, update, delete, get by id/name, fuzzy search) + `parseAnimeData()` which converts DB seconds → ms and computes derived fields (updateWeekday, updateTimeHHmm, lastEpisodeTimestamp).
- `src/api/index.ts` — Normalized handlers (`handleAddAnime`, `handleDeleteAnime`, `handleUpdateAnimeById`) that wrap DB operations with calendar event creation/deletion in transactions.
- `src/api/calendar.ts` — Calendar-event binding to anime records.

### Form system (data-driven, field registry pattern)

The form for adding/editing anime uses a **field registry + status-driven rendering** pattern to eliminate branching JSX:

- `src/components/Form/schema.ts` — Zod v4 `discriminatedUnion` on `status` field, producing a single `AnimeFormValues` type. Business validation (`validateAnimeBusiness`) runs as a form-level `onChange` validator on the TanStack Form instance.
- `src/components/Form/fieldRegistry.ts` — Maps field names → `(component, label)` pairs. Adding a new field means registering it here and optionally in `statusFieldMap`.
- `src/components/Form/statusConfig.ts` — Maps each `EStatus` value → ordered list of field names to render (serializing/completed/toBeUpdated each show different field sets).
- `src/components/Form/FormRenderer.tsx` — Subscribes to `status` via `useSelector`, reads the field list from `statusFieldMap`, renders fields from `fieldRegistry`. Contains zero business logic.
- `src/components/Form/AnimeForm.tsx` — Composition layer: `useAnimeForm` + `FormRenderer` + `useStatusEffect` + submit button. Exposes `forwardRef` with `setNameError` for duplicate-name check.
- `src/components/Form/hooks/useAnimeForm.ts` — Creates the TanStack Form instance with zod schema + business validation merged in `validators.onChange`.
- `src/components/Form/hooks/useStatusEffect.ts` — Side effects when switching status (e.g., pre-filling date fields).
- Each field in `src/components/Form/fields/` is a self-contained component receiving `{ form, label }` and binding to its own `form.Field name`.

`computeFirstEpisodeTimestamp()` in `src/utils/time.ts` is the unified function for converting form data → first-episode timestamp (ms), replacing the old 3-way if/else that was duplicated in add and edit pages.

### Time calculations (`src/utils/time.ts`)

Core anime scheduling math: episode times are linear (7-day intervals from the first episode). Key functions:
- `getAnimeStatus(totalEpisode, firstEpisodeTimestamp)` → `EStatus` (serializing/completed/toBeUpdated)
- `getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp)` → current episode number
- `getFirstEpisodeTimestamp()` — back-calculates the first episode from current episode + update day/time
- `getFirstEpisodeTimestampFromLast()` — back-calculates from completion date (inverse of `getLastEpisodeTimestamp`)

### State management

- **Server/DB state**: TanStack React Query (`@tanstack/react-query`) — mutations invalidate query keys to trigger live re-fetch. Global `queryClient` in `src/utils/react-query.ts`.
- **Live DB queries**: `useLiveQuery` from `drizzle-orm/expo-sqlite` for real-time SQLite reads (used on schedule and follows pages).
- **Form state**: TanStack React Form with discriminated union schema.
- **App state refresh**: `useAppStateRefresh` hook invalidates all queries when the app returns to foreground.

### Styling

- **NativeWind v5** (Tailwind CSS v4 for React Native) configured via `metro.config.js` + `nativewind/theme`.
- `src/global.css` imports Tailwind layers and defines theme colors (`--color-theme`, `--color-completed`, etc.).
- `src/utils/cn.ts` — Standard `clsx` + `tailwind-merge` helper.
- `src/styles/index.ts` — Shared constants (blurhash placeholder, theme color).

### Enum system

Uses `enum-plus` library. `EStatus` (completed/serializing/toBeUpdated) and `EWeekday` (monday–sunday) are defined in `src/enums/index.ts`. Enum-plus v3 removed `toMenu()`; iterate `.items` directly.

### Linting / formatting

- **Oxlint** with `oxlint-tailwindcss` plugin for Tailwind class validation.
- **Oxfmt** for formatting.
- Husky + lint-staged run both on commit.

### Path aliases

`@/` → `./src/`, `@/assets/` → `./assets/`. Configured in `tsconfig.json` and `vitest.config.ts`. Metro resolves these natively; no Babel plugin needed.

### AGENTS.md

Read the exact versioned Expo docs at `https://docs.expo.dev/versions/v56.0.0/` before writing any code.
