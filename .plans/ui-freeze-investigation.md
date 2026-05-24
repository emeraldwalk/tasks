# Investigation: UI Freeze on Touch

## Summary

The "stops responding then recovers" pattern points to the main thread being saturated by synchronous JavaScript triggered by a single user action. Touch events queue up while JS runs and process after it completes — which is why it recovers rather than hanging permanently. Three distinct issues compound each other, all rooted in one architectural problem.

---

## Root Cause: One Monolithic Signal for All Read State

`api.timeStampMap` is a single SolidJS signal covering all 66 books × all their chapters × all timestamps:

```ts
// api.ts
const [ts, setTs] = createSignal(timeStampMap, { equals: false })
```

`equals: false` means SolidJS treats every `setTs()` call as a change regardless of what changed. When Genesis 1 is marked read, every component subscribed to `timeStampMap` re-runs — including computations for Revelation 22.

---

## Issue 1 — Every mark-read triggers work in all 66 ChapterGroups

`ChapterGroup` has two reactive computations that both read `timeStampMap` indirectly:

**`completionStatus()`** — used in JSX as `<CheckMark state={completionStatus()} />`:
```ts
const completionStatus = () => {
  const count = api.completeCount(props.data.chapters)  // reads timeStampMap for every chapter in the book
  ...
}
```

**`createEffect` on `filteredChapters()`**:
```ts
createEffect(() => {
  setChapters(filteredChapters())  // filters book's chapters, calls hasChapterDates for each
})
```

`filteredChapters()` calls `api.hasChapterDates()` per chapter, which calls `getChapterDates()`, which reads `this.timeStampMap()`. So this effect subscribes to the monolithic signal.

**Result:** Marking one chapter as read triggers `completionStatus()` and `filteredChapters()` to re-run in all 66 rendered ChapterGroups simultaneously. With a large book like Psalms (150 chapters), each `completeCount` call iterates all 150 chapters. Total work is proportional to the total chapter count across all rendered groups.

---

## Issue 2 — The sort re-runs on every mark-read

`ChapterGroupList` on the Books view has `sortProgressToTop`:

```ts
const sortedGroupNames = () =>
  props.sortProgressToTop
    ? filteredGroupNames().toSorted((a, b) => {
        const aCount = api.completeCount(props.data[a]) > 0   // reads timeStampMap
        const bCount = api.completeCount(props.data[b]) > 0
        return Number(bCount) - Number(aCount)
      })
    : filteredGroupNames()
```

`sortedGroupNames()` is a plain reactive function (not a `createMemo`), used directly in `<For each={sortedGroupNames()}>`. It subscribes to `timeStampMap` via `completeCount`. On every mark-read:

- The sort comparator calls `api.completeCount()` for both sides of each comparison
- Sorting 66 books is O(n log n) ≈ ~400 comparisons
- Each comparison calls `completeCount` for both books, each iterating that book's chapters

This runs on top of Issue 1, in the same synchronous cascade.

---

## Issue 3 — Every mark-read triggers the cascade twice

In `Chapter.tsx`, `onAdd` is:

```ts
async function onAdd() {
  const date = now()
  setDates((prev) => [...prev, date])                                    // 1. local update
  await api.markAsRead(props.data.abbrev, props.data.number, date)       // 2. fires timeStampMap signal synchronously
  props.onChange()                                                        // 3. fires again after the IndexedDB await
}
```

`markAsRead` calls `_setTimeStampMap` synchronously before the `await addTimestamp(...)`. This fires the cascade from Issues 1 and 2. Then after the IndexedDB write resolves, `props.onChange()` calls `setChapters(filteredChapters())` in the parent ChapterGroup — triggering another round of filtering.

The cascade runs twice per tap.

---

## Issue 4 — `markAsUnread` missing await (correctness bug, not a freeze)

```ts
markAsUnread = async (...) => {
  ...
  deleteTimeStamp(this._db, book, chapter, date)  // not awaited
}
```

The function is `async` and callers `await` it, but the IndexedDB delete is fire-and-forget. If the app is closed immediately after removing a read mark, the deletion may not persist. Not a freeze cause but worth fixing alongside the others.

---

## Likely Freeze Scenario

On the Books view with all 66 groups rendered:

1. User taps a chapter's checkmark
2. `onAdd()` runs, calls `markAsRead`, which synchronously calls `_setTimeStampMap`
3. SolidJS propagates the signal: all 66 `completionStatus()` functions re-run, all 66 `createEffect` instances re-run `filteredChapters()`, and `sortedGroupNames()` re-sorts with `completeCount` on each pass
4. Total synchronous work: thousands of `hasChapterDates` calls, each doing `Object.keys(timeStampMap()[...])`, plus a full re-sort
5. Touch events are queued while this runs; UI appears frozen
6. After JS completes, touch events process and UI becomes responsive again
7. Then `props.onChange()` fires a second wave after the IndexedDB await

The more timestamps in the database (longer usage), the heavier `Object.keys(...)` becomes per chapter.

---

## Fixes

### Fix 1 — Memoize `sortedGroupNames` (highest impact, easiest)

Change from a plain reactive function to a `createMemo` in `ChapterGroupList.tsx`:

```ts
const sortedGroupNames = createMemo(() =>
  props.sortProgressToTop
    ? filteredGroupNames().toSorted(...)
    : filteredGroupNames()
)
```

`createMemo` caches the result and only re-runs when its dependencies actually change. More importantly, wrap the sort comparator to avoid reading `timeStampMap` on every comparison — compute a `Set` of books-with-progress once before sorting:

```ts
const sortedGroupNames = createMemo(() => {
  const names = filteredGroupNames()
  if (!props.sortProgressToTop) return names
  const hasProgress = new Set(names.filter(n => api.completeCount(props.data[n]) > 0))
  return names.toSorted((a, b) => Number(hasProgress.has(b)) - Number(hasProgress.has(a)))
})
```

This reduces sort-time `completeCount` calls from O(n log n) to O(n).

### Fix 2 — Memoize `completionStatus` in ChapterGroup

```ts
const completionStatus = createMemo(() => {
  const count = api.completeCount(props.data.chapters)
  if (count === props.data.chapters.length) return 'complete'
  if (count > 0) return 'partial'
  return 'incomplete'
})
```

`createMemo` batches re-runs and only propagates downstream if the return value changes (e.g., `'incomplete'` → `'partial'`). Most mark-read events won't change a book's completion tier, so this short-circuits the CheckMark re-render.

### Fix 3 — Remove `props.onChange()` from `onAdd` and `onRemove`

`props.onChange()` calls `setChapters(filteredChapters())` in the parent `ChapterGroup`. But `filteredChapters()` already runs reactively via the `createEffect` whenever `timeStampMap` changes — which `markAsRead` and `markAsUnread` both trigger synchronously. `props.onChange()` is therefore redundant and causes the cascade to run a second time after the IndexedDB await resolves.

Remove it from both `onAdd` and `onRemove`, and remove the `onChange` prop from `Chapter` entirely (including its interface and every call site in `ChapterGroup`):

```ts
// Chapter.tsx — onAdd
async function onAdd() {
  const date = now()
  setDates((prev) => [...prev, date])
  await api.markAsRead(props.data.abbrev, props.data.number, date)
}

// Chapter.tsx — onRemove
function onRemove(date: ISODateTimeString) {
  return async () => {
    setDates((prev) => prev.filter((d) => d !== date))
    await api.markAsUnread(props.data.abbrev, props.data.number, date)
  }
}
```

Also remove `onChange: () => void` from `ChapterProps`, `onChapterChange` from `ChapterGroup`, and the `onChange={onChapterChange}` prop passed to `<Chapter>`.

### Fix 4 — Await `deleteTimeStamp` in `markAsUnread`

```ts
markAsUnread = async (...) => {
  ...
  await deleteTimeStamp(this._db, book, chapter, date)
}
```

### Fix 5 — Remove the `console.log` in `groupByDay`

Remove line 20 of `utils/groupUtils.ts` — the `console.log` call inside `groupByDay`. Not a freeze cause in production (no DevTools attached), but should not be in shipped code.

---

## Longer-Term: Fine-Grained Signals

Fixes 1–4 reduce the work per cascade significantly. A deeper fix would split `timeStampMap` into per-book signals so a change to Genesis only notifies Genesis subscribers. That's a larger refactor and likely unnecessary once the memo fixes are in place — worth revisiting if freezes persist after the quick fixes.
