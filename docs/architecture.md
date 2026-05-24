# Architecture

## Layer Overview

```
┌─────────────────────────────────────────────────┐
│  UI Components  (web/src/components/)            │
│  SolidJS reactive components + CSS Modules       │
├─────────────────────────────────────────────────┤
│  Api class  (web/src/data/api.ts)                │
│  Single shared instance; owns all reactive state │
├────────────────────┬────────────────────────────┤
│  IndexedDB layer   │  Static data utils          │
│  (indexDb.ts)      │  (utils/dataUtils.ts)       │
│  Runtime read/write│  Build-time parsed txt files│
└────────────────────┴────────────────────────────┘
```

## Api Class — Central State Hub

`Api` (`web/src/data/api.ts`) is the single source of truth for all mutable state. It is:

- Constructed once via `Api.create()` (async factory) in `App.tsx`
- Injected app-wide through `ApiContext` (SolidJS context)
- Consumed in every component via `useApi()`

### Reactive signals on Api

| Signal | Type | Description |
|--------|------|-------------|
| `timeStampMap` | `Accessor<TimeStampMap>` | Nested map of all read timestamps |
| `showCompleted` | `Accessor<boolean>` | Whether completed chapters are visible |
| `searchText` | `Accessor<string>` | Current search filter string |
| `perDayTagData` | `Accessor<PerDayTagData[]>` | Plan settings: tags + chapters-per-day |

### Api construction sequence

```
App mounts
  → Api.create() [async]
      → initDb()           opens IndexedDB BibleReadDB v2
      → getTimeStampMap()  loads all timestamps into memory
      → getSettingsData()  loads showCompleted setting
      → getChapterData()   parses chapters.txt (sync)
      → getTagsData()      parses tags.txt (sync)
  → ApiProvider wraps AppRouter with resolved Api instance
```

## Routing

`AppRouter` (`web/src/components/AppRouter.tsx`) uses `@solidjs/router` with `Layout` as the shared root. The base URL comes from `import.meta.env.BASE_URL` (set to `/tasks/` for GitHub Pages by Vite config).

Route data computations happen once in `AppRouter`:

- `bookGroups` — `groupByBook(chapters)` — static, computed once
- `planGroups` — `groupByDay(chapters, tags, OT_NT)` — wrapped in `createMemo`, recomputes when `perDayTagData` changes

## Data Flow: Marking a Chapter Read

```
User clicks CheckMark in Chapter.tsx
  → Chapter.onAdd()
      → api.markAsRead(abbrev, chapter, now())
          → mutates timeStampMap in memory
          → _setTimeStampMap(timeStampMap)  [signals update with equals:false]
          → addTimestamp(db, ...)           [persists to IndexedDB]
  → props.onChange()  [parent ChapterGroup refreshes its filtered list]
```

## Data Flow: Plan Generation

```
AppRouter reads api.perDayTagData()
  → planGroups memo recomputes groupByDay(chapters, tags, perDayTagData)
      → for each tag (OT, NT): filter chapters by tag membership
      → distribute chapters into day buckets at the configured rate
      → returns Record<"Day N", ChapterData[]>
  → ChapterGroupList renders each day as a ChapterGroup accordion
```

## Persistence

All persistence is local to the browser via IndexedDB (`BibleReadDB`, version 2):

| Object Store | Key format | Content |
|---|---|---|
| `timestamps` | `ISO_ABBREV_CHAPTER` | One record per read event |
| `settings` | `"1"` (singleton) | `{ showCompleted: boolean }` |

The full timestamp map is loaded into memory at startup. Writes go to both the in-memory signal and IndexedDB simultaneously. There is no server, no sync, and no conflict resolution.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`:

1. Installs Node 20, runs `npm ci && npm run build` in `./web`
2. Publishes `./web/dist` to the `gh-pages` branch via `peaceiris/actions-gh-pages`
3. GitHub Pages serves the static bundle
