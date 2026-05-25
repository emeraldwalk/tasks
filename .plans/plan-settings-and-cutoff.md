# Plan: Plan Settings & Sliding Cutoff Date

## Goals

1. Make PlanSettings actually drive plan generation (currently disconnected).
2. Add a sliding cutoff date so only reads within a recent window count as "complete."

---

## Current State Summary

### Why PlanSettings does nothing today

`AppRouter.tsx:11-23` hardcodes:

```ts
const OT_NT = { OT: 3, NT: 2 } as Record<Tag, number>

const planGroups = createMemo(() =>
  groupByDay(chapters, api.getTags(), OT_NT),  // never reads api.perDayTagData()
)
```

`api.perDayTagData` is a live signal that `PlanSettings` writes to, but `AppRouter` ignores it entirely.

### Other gaps in the settings UI

- `TagSelector` number input has no `value` or `onChange` — count changes are lost.
- Selected tags have no remove button — once added, a tag is stuck.
- `perDayTagData` is not persisted — resets to `[{OT,3},{NT,2}]` on every page load.
- No way to add or delete an entire plan group row.

---

## Resolved Design Decisions

### Q1 — Multi-tag group semantics ✓

Each `PerDayTagData` entry has `tags: Tag[]` and `count: number`. The tags array defines an **ordered concatenated pool**: chapters from each tag are appended in array order to form one sequence. `count` chapters per day are drawn from that sequence.

When a pool is exhausted it **loops**. This keeps the daily total consistent across all days. Because the longest pool sets the natural length of the plan, shorter pools will cycle through more than once over the life of the plan.

Example: `{ tags: ['NT', 'PS'], count: 2 }` means "draw 2 chapters per day from a pool of all NT chapters followed by all PS chapters, looping when the combined pool is exhausted."

A second entry `{ tags: ['OT'], count: 3 }` runs as an independent stream alongside the first.

**Consequence — target days is required.** The current `groupByDay` derives `totalDays` from `ceil(longest tag / count)`, which only works without looping. With looping every stream is infinite, so a separate **target days** value must be specified. This becomes a top-level plan setting (see data model changes below).

**`groupByDay` must be rewritten** to accept `PerDayTagData[]` directly (not `Record<Tag, number>`) so it can build per-entry pooled streams. The old signature is removed.

### Q2 — Cutoff type ✓

Support **both** a rolling window (N days) and a fixed date. Either or both can be active simultaneously. The effective cutoff is the **more recent** of the two active values. If neither is set, all timestamps count.

```ts
interface CutoffSettings {
  cutoffDays: number | null   // rolling: now() - N days
  cutoffDate: string | null   // fixed: specific ISO date string (date only, no time)
}
```

Effective cutoff computation:

```ts
function effectiveCutoff(cutoffDays: number | null, cutoffDate: string | null): string | null {
  const rolling = cutoffDays != null
    ? new Date(Date.now() - cutoffDays * 86400000).toISOString().slice(0, 10)
    : null
  const candidates = [rolling, cutoffDate].filter(Boolean) as string[]
  return candidates.length ? candidates.toSorted().at(-1)! : null
}
```

### Q3 + Q4 — Cutoff scope ✓

The cutoff affects **both Books and Plan views**. History always shows the full unfiltered log.

`Api.hasChapterDates` is the single gate for completion status in both views. Updating it is sufficient — no component changes needed:

```ts
hasChapterDates = ({ abbrev, number }) => {
  const dates = this.getChapterDates({ abbrev, number })
  const cutoff = this.effectiveCutoff()   // derived from cutoffDays + cutoffDate signals
  if (!cutoff) return dates.length > 0
  return dates.some(d => d.slice(0, 10) >= cutoff)
}
```

---

## Resolved: Persistence & UI Scope

### Q5 — Persist `perDayTagData` ✓

All new settings fields (`perDayTagData`, `targetDays`, `cutoffDays`, `cutoffDate`) are added to the existing `settings` singleton record in the `settings` object store. No IndexedDB version bump — new fields are simply absent on existing records and `getSettingsData` fills in defaults. This is safe because we are only adding fields, not restructuring existing ones.

**Current storage layout for reference:**

| Store | Key | Contents |
|-------|-----|----------|
| `timestamps` | `date_ABBREV_chapter` | One record per chapter read event (all progress data) |
| `settings` | `"1"` (singleton) | User preferences; gains new plan fields |

### Q6 — Add/remove plan group rows ✓ (deferred)

Add/remove of `PerDayTagData` rows in `PlanSettings` is deferred. The default two rows (OT, NT) are fixed for this feature. Row management will come alongside tag management (a future feature that lets users define which books belong to a tag).

---

## Data Model Changes

### `SettingsData` (new fields)

```ts
interface SettingsData {
  showCompleted: boolean      // persisted UI preference; excluded from export/import
  targetDays: number          // how many day buckets to generate; default 365
  cutoffDays: number | null   // rolling window; null = disabled
  cutoffDate: string | null   // fixed date (YYYY-MM-DD); null = disabled
}
```

### `PerDayTagData` — unchanged in shape, clarified semantics

```ts
interface PerDayTagData {
  tags: Tag[]    // ordered concatenated pool; chapters drawn in tag-array order
  count: number  // chapters drawn from this pool per day
}
```

### `groupByDay` — new signature

```ts
function groupByDay(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  perDayTagData: PerDayTagData[],
  targetDays: number,
): Record<string, ChapterData[]>
```

Algorithm sketch:

```
for each entry in perDayTagData:
  pool = chapters where tagRecord[tag][ch.abbrev] for tag in entry.tags (in order, concatenated)
  cursor = 0

for day 1..targetDays:
  group = []
  for each entry:
    for i in 0..entry.count-1:
      group.push(pool[cursor % pool.length])
      cursor++
  groups["Day N"] = group
```

---

## Implementation Steps

### Step 1 — Fix `groupByDay` (`utils/groupUtils.ts`)

- Replace `tagPerDay: Record<Tag, number>` parameter with `perDayTagData: PerDayTagData[], targetDays: number`.
- Build one pooled chapter array per entry (tags concatenated in order).
- Loop each pool using `cursor % pool.length`.
- Iterate exactly `targetDays` times.
- Remove the debug `console.log`.

### Step 2 — Extend settings schema (`data/model.ts`, `data/indexDb.ts`)

- Add `targetDays`, `cutoffDays`, `cutoffDate` to `SettingsData`.
- **No IndexedDB version bump.** The `settings` object store already exists; adding new fields to the stored record requires no schema change. Existing records simply won't have the new fields — `getSettingsData` handles this by defaulting them.
- Update `getSettingsData` defaults: `targetDays = 365`, `cutoffDays = null`, `cutoffDate = null`. `showCompleted` default stays `true` as it already is.
- Update `updateSettings` in `indexDb.ts` — change its signature from `(db: IDBDatabase, showCompleted: boolean)` to `(db: IDBDatabase, settings: SettingsData)` and write the full settings object. Update the existing call site in `api.ts:toggleShowCompleted` to pass the full settings object instead of just the boolean.

### Step 3 — Extend `Api` (`data/api.ts`)

- Add three signals initialised from `settingsData`: `targetDays`, `cutoffDays`, `cutoffDate` (with public accessors and setters following the existing pattern).
- Add a private method `effectiveCutoff(): string | null` on the `Api` class (not a signal — computed on demand from `cutoffDays()` and `cutoffDate()`):
  ```ts
  private effectiveCutoff(): string | null {
    const rolling = this.cutoffDays() != null
      ? new Date(Date.now() - this.cutoffDays()! * 86400000).toISOString().slice(0, 10)
      : null
    const candidates = [rolling, this.cutoffDate()].filter(Boolean) as string[]
    return candidates.length ? candidates.toSorted().at(-1)! : null
  }
  ```
- Update `hasChapterDates` to call `this.effectiveCutoff()` and filter dates accordingly.
- Each setter must also call `updateSettings(this._db, <full current settings object>)` to persist the change. Since `_settingsData` will be stale after construction, derive the current settings from the signals at persist time rather than reading `_settingsData`.

### Step 4 — Fix `TagSelector` (`components/TagSelector.tsx`)

- Bind `<input type="number" value={props.value.count} min={1} onInput={e => props.onChange({...props.value, count: +e.target.value})} />`.
- Add a remove button to each tag chip: `props.onChange({...props.value, tags: props.value.tags.filter(t => t !== tagName)})`.

### Step 5 — Fix `AppRouter` (`components/AppRouter.tsx`)

- Delete the hardcoded `OT_NT` constant.
- Update `planGroups` memo to use `api.perDayTagData()` and `api.targetDays()`:

```ts
const planGroups = createMemo(() =>
  groupByDay(chapters, api.getTags(), api.perDayTagData(), api.targetDays())
)
```

### Step 6 — Add cutoff UI to `PlanSettings` (`components/PlanSettings.tsx`)

Two inputs below the tag group list:

```
Target days:   [_365_]
Cutoff (days): [_____]   (blank = disabled)
Cutoff (date): [date picker]   (blank = disabled)
```

Each calls the corresponding Api setter on change.

---

## Affected Files

| File | Change |
|------|--------|
| `data/model.ts` | Add `targetDays`, `cutoffDays`, `cutoffDate` to `SettingsData` |
| `data/api.ts` | Add signals + setters for new settings; `effectiveCutoff()`; update `hasChapterDates` |
| `data/indexDb.ts` | Bump to v3; persist new settings fields |
| `utils/groupUtils.ts` | Rewrite `groupByDay` with new signature, pooling, looping, `targetDays`; remove `console.log` |
| `components/AppRouter.tsx` | Remove `OT_NT`; pass `api.perDayTagData()` and `api.targetDays()` to `groupByDay` |
| `components/TagSelector.tsx` | Wire count input; add tag remove buttons |
| `components/PlanSettings.tsx` | Add `targetDays`, `cutoffDays`, `cutoffDate` inputs |
