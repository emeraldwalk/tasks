# Data Model

## Branded Types (`web/src/data/model.ts`)

The codebase uses a `Brand<TID, TBase>` pattern to make primitives type-safe at compile time without runtime overhead.

| Type | Base | Purpose |
|------|------|---------|
| `BookName` | `string` | Full book name e.g. `"Genesis"` |
| `BookAbbrev` | `string` | Short code e.g. `"GEN"` |
| `ChapterID` | `number` | Chapter number (1-based) |
| `ISODateTimeString` | `string` | `new Date().toISOString()` output |
| `Tag` | `string` | Tag name e.g. `"OT"`, `"NT"` |
| `PlanId` | `string` | Unique id for a `ReadingPlan` (`crypto.randomUUID()`) |
| `MMDD` | template | `"MM/DD"` display string |
| `MMDDYYYY` | template | `"MM/DD/YYYY"` display string |

## Core Interfaces

### `BookData`
Raw data for a Bible book (not used in components directly; `ChapterData` is the working unit).

```ts
{ name: BookName, abbrev: BookAbbrev, chapterCount: number }
```

### `ChapterData`
One chapter entry. The `chapters.txt` parser expands each book row into N `ChapterData` entries.

```ts
{ name: BookName, abbrev: BookAbbrev, number: ChapterID }
```

### `ChapterGroupData`
A named group of chapters rendered as an accordion row.

```ts
{ name: string, chapters: ChapterData[] }
```

### `TimeStampMap`
In-memory index of all read events. Three-level nested map for O(1) lookup by book → chapter → date.

```ts
{
  [book: BookAbbrev]: {
    [chapter: ChapterID]: {
      [date: ISODateTimeString]: boolean
    }
  }
}
```

### `TimeStampData`
Flat representation of a single read event used for History list rendering.

```ts
{ date: ISODateTimeString, book: BookAbbrev, chapter: ChapterID }
```

### `TagRecord`
Maps each tag name to the set of books it covers (used to filter chapters for plan generation).

```ts
Record<Tag, Record<BookAbbrev, boolean>>
```

Default tags defined in `tags.txt`; see `web/src/data/tags.txt` below for the full built-in list.

There are two independent sources of `TagRecord` entries, both computed in `Api`:

- `Api.getTags()` — the curated group tags from `tags.txt` (`OT`, `Pentateuch`, `Gospels`, ...).
- `Api.getBookTags()` — one synthetic pseudo-tag per Bible book, generated at runtime from `chapters.txt` (`getBookTagsData()` in `dataUtils.ts`) rather than a static file. Each is keyed by the book's full name (e.g. `"Genesis"`) and maps to just that one book, so a single book can be added to a plan group the same way a tag group is. `Api.getBookTagDescriptions()` gives each a `"N chapters"` description.
- `Api.getAllTags()` — the merged union (`{ ...getTags(), ...getBookTags() }`), precomputed once at construction. This is what actually resolves a `PerDayTagData`'s `tags: Tag[]` to chapters — `groupByDay` (plan generation) and `computeGroupStat` (Settings group stats) both take this merged record, not `getTags()` alone.

A few tags (`Acts`, `Revelation`) exist in both sources, since each covers exactly one book. `TagSelector`'s picker lists books after tags in a separate, visually distinct section, and excludes any book name that collides with an existing tag name (so those two aren't shown twice) — see `PlanSettings.tsx`'s `bookTagNames()`. Where a name exists in both sources, the tag's hand-written description wins over the book's chapter count (`PlanSettings.tsx`'s `tagDescriptions()` spreads book descriptions first, tag descriptions second).

### `PerDayTagData`
One row within a `ReadingPlan` — which tags and how many chapters of each to read per day.

```ts
{ tags: Tag[], count: number }
```

### `ReadingPlan`
A named, self-contained reading configuration. Users can define multiple plans; exactly one is active at a time (`SettingsData.activePlanId`). `Api.perDayTagData()` / `Api.targetDays()` and their setters always read/write the **active** plan.

```ts
{
  id: PlanId
  name: string
  targetDays: number
  perDayTagData: PerDayTagData[]
}
```

Default plan created on first run (id `'default'`, or migrated from a pre-multi-plan record — see below):

```ts
{
  id: 'default',
  name: 'My Plan',
  targetDays: 365,
  perDayTagData: [
    { tags: ['OT'], count: 3 },
    { tags: ['NT'], count: 2 },
  ],
}
```

### `SettingsData`

```ts
{
  showCompleted: boolean
  cutoffDays: number | null
  cutoffDate: string | null
  showAllDates: boolean
  plans: ReadingPlan[]
  activePlanId: PlanId
}
```

`cutoffDays`/`cutoffDate`/`showAllDates` are global (not per-plan) — they control how far back completed chapters remain visible, independent of which plan is active.

### `ExportFormat`
Shape written by `Api.exportData()` / read by `Api.importData()` (Settings → Data → Export/Import).

```ts
{
  version: 2
  exportedAt: ISODateTimeString
  recordCount: number
  settings: { plans: ReadingPlan[], activePlanId: PlanId }
  timestamps: TimeStampData[]
}
```

`importData()` also accepts `version: 1` files (pre-multi-plan exports, `settings: { perDayTagData: PerDayTagData[] }`) and folds them into the currently active plan rather than replacing the plan list.

## IndexedDB Schema

Database name: `BibleReadDB`, version: `2`.

### `timestamps` object store

Key path: `id` (string composite key)

Key format: `${ISODateTimeString}_${BookAbbrev}_${ChapterID}`

Example: `"2025-05-24T12:00:00.000Z_GEN_1"`

Each record represents one reading event. Multiple records for the same chapter are allowed (re-reads on different dates).

### `settings` object store

Key path: `id` (always `"1"` — singleton row). Shape mirrors `SettingsData` plus two now-unused legacy fields (`targetDays`, `perDayTagData`) read only for migration — see below.

Defaults when no record exists: `showCompleted = true`, `cutoffDays = null`, `cutoffDate = null`, `showAllDates = false`, a single default `ReadingPlan` (above) as the only entry in `plans`.

**Migration from pre-multi-plan records**: `getSettingsData()` in `indexDb.ts` checks for a `plans` array on the stored record. If absent (a record written before the multi-plan feature existed), it synthesizes a single `ReadingPlan` named `"My Plan"` from the record's legacy top-level `targetDays`/`perDayTagData` fields (or the hardcoded defaults if those are also absent) and makes it active. The legacy fields are never written again once the record is next saved.

## Static Data Files

### `web/src/data/chapters.txt`

CSV format: `ABBREV,Full Name,Chapter Count`

```
GEN,Genesis,50
EXO,Exodus,40
...
```

Parsed by `getChapterData()` in `dataUtils.ts` into a flat `ChapterData[]` of all 1,189 Bible chapters in canonical order.

### `web/src/data/tags.txt`

CSV format: `TAG,ABBREV`

```
OT,GEN
OT,EXO
...
NT,MAT
...
```

Parsed by `getTagsData()` into a `TagRecord`. Built-in tags: `OT`, `NT`, `Gospels`, `Pentateuch`, `History`, `Wisdom`, `MajorProphets`, `MinorProphets`, `Acts`, `PaulineEpistles`, `GeneralEpistles`, `Revelation`. Additional tags can be added here to enable custom plan groupings.

### `web/src/data/tagDescriptions.txt`

CSV format: `TAG,Description` (only the first comma is a delimiter — the description may contain further commas).

```
OT,Old Testament — Genesis through Malachi (39 books)
NT,New Testament — Matthew through Revelation (27 books)
...
```

Parsed by `getTagDescriptions()` into a `TagDescriptions` (`Record<Tag, string>`), surfaced in `TagSelector`'s tag picker so users can see what each tag covers before selecting it. A tag without an entry here simply has no description shown.
