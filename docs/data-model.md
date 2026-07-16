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

### `PerDayTagData`
One row in the Plan Settings — which tags and how many chapters of each to read per day.

```ts
{ tags: Tag[], count: number }
```

Default initial value (hardcoded in `Api` constructor):

```ts
[
  { tags: ['OT'], count: 3 },
  { tags: ['NT'], count: 2 },
]
```

### `SettingsData`

```ts
{ showCompleted: boolean }
```

## IndexedDB Schema

Database name: `BibleReadDB`, version: `2`.

### `timestamps` object store

Key path: `id` (string composite key)

Key format: `${ISODateTimeString}_${BookAbbrev}_${ChapterID}`

Example: `"2025-05-24T12:00:00.000Z_GEN_1"`

Each record represents one reading event. Multiple records for the same chapter are allowed (re-reads on different dates).

### `settings` object store

Key path: `id` (always `"1"` — singleton row)

```ts
{ id: '1', showCompleted: boolean }
```

Default when no record exists: `showCompleted = true`.

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
