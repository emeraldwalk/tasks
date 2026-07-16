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
| `plans` | `Accessor<ReadingPlan[]>` | All configured reading plans |
| `activePlanId` | `Accessor<PlanId>` | Which plan currently drives the reading list |

`perDayTagData()` and `targetDays()` are plain derived getters (not their own signals) that read from `activePlan()` — the plan whose id matches `activePlanId()`. Their setters (`setPerDayTagData`, `setTargetDays`) likewise only ever mutate the active plan; `addPlan`/`renamePlan`/`removePlan`/`setActivePlanId` manage the `plans` list itself. Only one plan is active at a time, and switching which one is active is what changes what `/plan` shows.

### Api construction sequence

```
App mounts
  → Api.create() [async]
      → initDb()           opens IndexedDB BibleReadDB v2
      → getTimeStampMap()  loads all timestamps into memory
      → getSettingsData()  loads settings, migrating pre-multi-plan records into a single plan
      → getChapterData()   parses chapters.txt (sync)
      → getTagsData()      parses tags.txt (sync)
  → ApiProvider wraps AppRouter with resolved Api instance
```

## Routing

`AppRouter` (`web/src/components/AppRouter.tsx`) uses `@solidjs/router` with `Layout` as the shared root. The base URL comes from `import.meta.env.BASE_URL` (set to `/tasks/` for GitHub Pages by Vite config).

Route data computations happen once in `AppRouter`:

- `bookGroups` — `groupByBook(chapters)` — static, computed once
- `planGroups` — `groupByDay(chapters, tags, perDayTagData, targetDays)` — wrapped in `createMemo`, recomputes when the active plan's `perDayTagData`/`targetDays` change (including when `activePlanId` itself changes, since that swaps which plan's data those getters return)

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
| `settings` | `"1"` (singleton) | `SettingsData` — `showCompleted`, cutoff fields, and `plans`/`activePlanId` (see `docs/data-model.md`) |

The full timestamp map is loaded into memory at startup. Writes go to both the in-memory signal and IndexedDB simultaneously. There is no server, no sync, and no conflict resolution.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`:

1. Installs Node 20, runs `npm ci && npm run build` in `./web`
2. Publishes `./web/dist` to the `gh-pages` branch via `peaceiris/actions-gh-pages`
3. GitHub Pages serves the static bundle
