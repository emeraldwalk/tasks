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

### Data model mismatch

`PerDayTagData` (the signal type):
```ts
{ tags: Tag[], count: number }  // one count shared across an array of tags
```

`groupByDay` signature (what AppRouter calls):
```ts
tagPerDay: Record<Tag, number>  // one independent count per tag
```

These are structurally different. Before wiring them together a decision is needed on which model wins (see Questions below).

### Other gaps in the settings UI

- `TagSelector` number input has no `value` or `onChange` — count changes are lost.
- Selected tags have no remove button — once added, a tag is stuck.
- `perDayTagData` is not persisted — resets to `[{OT,3},{NT,2}]` on every page load.
- No way to add or delete an entire plan group row.

---

## Proposed Work

### Part 1 — Wire PlanSettings to plan generation

#### 1a. Decide and fix the data model (see Questions #1)

Assuming the resolution is **one count per group, chapters pooled from all tags in the group**, the transformation from `PerDayTagData[]` → what `groupByDay` needs is either:

**Option A** — Transform at the call site, keep `groupByDay` signature as-is:
```ts
// flatten: each group's tags all share the same count
const tagPerDay = api.perDayTagData().reduce((acc, { tags, count }) => {
  tags.forEach(tag => { acc[tag as Tag] = count })
  return acc
}, {} as Record<Tag, number>)
groupByDay(chapters, api.getTags(), tagPerDay)
```
This loses the pooling concept — each tag still gets its own independent chapter stream.

**Option B** — Change `groupByDay` to accept `PerDayTagData[]` directly, so it can pool chapters from multiple tags into one stream per group:
```ts
function groupByDay(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  perDayTagData: PerDayTagData[],
): Record<string, ChapterData[]>
```
More correct to the intended semantics, but requires changing the function signature.

#### 1b. Fix TagSelector

- Wire `<input type="number" value={props.value.count} onInput={...} onChange={...} />` to call `props.onChange({ ...props.value, count: newCount })`.
- Add a remove affordance to each tag chip (e.g., an ✕ button) that calls `props.onChange({ ...props.value, tags: tags.filter(t => t !== tagName) })`.

#### 1c. Connect AppRouter

Replace the hardcoded `OT_NT` constant with a reactive read:

```ts
const planGroups = createMemo(() => {
  // transform or pass perDayTagData depending on model decision
  return groupByDay(chapters, api.getTags(), api.perDayTagData())
})
```

#### 1d. Add/remove plan groups

Add buttons in `PlanSettings` to append a new empty `PerDayTagData` row and to delete an existing row.

#### 1e. Persist perDayTagData

Add a `perDayTagData` field to the `settings` object store (or a new store). Load it on `Api.create()` and save it on change. Requires an IndexedDB version bump (v2 → v3).

---

### Part 2 — Sliding cutoff date

#### Concept

A cutoff is a point in time before which timestamps do not count for "completion." If a chapter was last read before the cutoff, it shows as unread in the Plan and Books views.

#### Where it lives

- Stored in the `settings` object store alongside `showCompleted`.
- Exposed on `Api` as a reactive signal `cutoffDate: Accessor<ISODateTimeString | null>` (null = no cutoff, all reads count).
- UI control in `PlanSettings` sidebar.

#### Effect on existing logic

`Api.hasChapterDates` is the single gate used by `ChapterGroup`, `ChapterGroupList`, and `completeCount`. It currently returns true if any timestamp exists. With a cutoff:

```ts
hasChapterDates = ({ abbrev, number }) => {
  const dates = this.getChapterDates({ abbrev, number })
  const cutoff = this.cutoffDate()
  if (!cutoff) return dates.length > 0
  return dates.some(d => d >= cutoff)
}
```

No other files need to change for Books and Plan views to pick up the cutoff automatically.

History view (`HistoryList`) should still show all timestamps regardless of cutoff — it is a full audit log.

#### Cutoff UI

Two candidate shapes (see Questions #2):

**Rolling window** — user sets a number of days (e.g., 365):
```
Cutoff: [_365_] days
```
The effective cutoff date is computed as `now() - N days` at read time. Stored as a day count integer.

**Fixed date** — user picks a specific date:
```
Cutoff: [date picker]
```
Stored as an ISO date string. User must update it manually each cycle.

---

## Open Questions / Design Decisions

### Q1 — Multi-tag group semantics

`PerDayTagData` allows `tags: ['OT', 'NT']` in a single group (one count for both). What does that mean?

- **Option A (pool)**: Treat OT and NT chapters as one merged pool, pick `count` chapters per day from it. Result: chapters from both tags interleave into a single stream.
- **Option B (independent)**: Each tag in the group gets its own independent `count`-per-day stream, same as today's behavior. Multiple tags in one row is just a display grouping.
- **Option C (simplify the model)**: Remove `tags: Tag[]` and make it `tag: Tag` (singular). Each row is always one tag + one count. Simpler model, simpler UI.

The current default only ever uses one tag per group, so the multi-tag case has never been exercised.

### Q2 — Cutoff type: rolling window vs. fixed date

- **Rolling window** (days ago): Natural for "re-read every year" workflows; automatically advances with time; no manual upkeep.
- **Fixed date**: Explicit; "I started fresh on Jan 1, 2025" is clear; requires manual update each cycle.

Can be both — a fixed date plus a day-count field. But that adds UI complexity.

### Q3 — Cutoff scope: which views does it affect?

- Plan view only?
- Plan + Books views (same `hasChapterDates` gates both)?
- History view? (Recommendation: no — History is a raw log.)

### Q4 — Should the cutoff affect the Books view completion display?

If Books always shows "true" completion (any timestamp ever) while Plan uses the cutoff, the two views diverge. That could be confusing or it could be useful (Books = all-time record, Plan = current cycle).

### Q5 — Persist perDayTagData?

Currently it resets on every page load. Should it survive a refresh? Almost certainly yes — it requires an IndexedDB schema bump (v2 → v3).

### Q6 — Add/remove plan groups?

The `PlanSettings` sidebar lists one row per `PerDayTagData` entry. Should the user be able to add a new row or delete an existing one? If yes, needs add/delete buttons and an initial empty state to handle.

---

## Affected Files

| File | Change |
|------|--------|
| `data/model.ts` | Possibly change `PerDayTagData.tags` to singular; add `cutoffDate` to `SettingsData` |
| `data/api.ts` | Add `cutoffDate` signal; update `hasChapterDates`; persist `perDayTagData` |
| `data/indexDb.ts` | Version bump; persist `perDayTagData` and `cutoffDate` in settings store |
| `utils/groupUtils.ts` | Update `groupByDay` signature if Option B chosen; remove debug `console.log` |
| `components/AppRouter.tsx` | Replace hardcoded `OT_NT`; pass `api.perDayTagData()` to `groupByDay` |
| `components/TagSelector.tsx` | Wire number input; add tag remove buttons |
| `components/PlanSettings.tsx` | Add cutoff UI control; add add/delete group buttons |
