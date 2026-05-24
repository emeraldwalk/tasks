# Plan: Data Backup & Export

## Problem

All reading history lives in IndexedDB (`BibleReadDB`) in the browser. This data can be lost:

- **iOS/Safari storage eviction**: Safari can evict origin storage under low-storage conditions. PWAs not installed to the home screen receive the least protection (7-day inactivity eviction applies in some iOS versions).
- **Browser data cleared**: User clears site data or browser history.
- **Device replacement**: Moving to a new phone with no data migration.
- **Browser switch**: Moving from Safari to Chrome or vice versa.

**Note — republishing is not a risk.** Deploying new app code to GitHub Pages does not affect IndexedDB. The database is tied to the origin (`emeraldwalk.github.io`), not the app files. The only code-side risk is a bad schema migration in `indexDb.ts` (renaming the database or dropping stores in `onupgradeneeded`), which must be guarded carefully when adding new fields.

---

## Immediate One-Off Dump (Before Any Code Changes)

A console script at `scripts/dump-indexeddb.js` can be pasted into browser DevTools right now — no app changes required.

### How to run on iPhone data (recommended path)

1. **iPhone**: Settings → Safari → Advanced → Web Inspector: ON
2. Connect iPhone to Mac via USB; trust the connection when prompted
3. Open the app in Safari on iPhone (`emeraldwalk.github.io/tasks/`)
4. **Mac**: Safari → Develop → [your iPhone] → `emeraldwalk.github.io/tasks/`
5. Paste the contents of `scripts/dump-indexeddb.js` into the Console tab, press Enter
6. A `.json` download is triggered on the iPhone (Files → Downloads)
7. The full JSON is also printed to the Mac console — copy it from there if the download doesn't land cleanly

The script reads `BibleReadDB` without making any writes.

---

## In-App Backup Feature

### Recommended design

**Format: JSON download + JSON import.** Self-contained, works offline, no backend or third-party service. Consistent with the app's static design.

**Export file format:**

```json
{
  "version": 1,
  "exportedAt": "2025-05-24T12:00:00.000Z",
  "recordCount": 412,
  "settings": {
    "showCompleted": true,
    "targetDays": 365,
    "cutoffDays": null,
    "cutoffDate": null,
    "perDayTagData": [
      { "tags": ["OT"], "count": 3 },
      { "tags": ["NT"], "count": 2 }
    ]
  },
  "timestamps": [
    { "date": "2025-01-01T08:00:00.000Z", "book": "GEN", "chapter": 1 }
  ]
}
```

The `version` field guards against future format changes — import logic can branch on it.

### Resolved design decisions

**Include settings in export (yes).** Full export gives a complete restore point after a device wipe. Settings are small and useful to preserve; a full export is strictly more useful than timestamps-only.

**Import behavior: merge.** Timestamps are keyed by `date_book_chapter` which is already a natural deduplicator — importing the same record twice is a no-op. Settings are replaced on import. Merge means an old backup cannot wipe newer reads.

**UI location: new `/settings` route.** The sidebar is plan-focused and already growing. A dedicated Settings page is the right home for data management controls and will absorb future settings without crowding the plan UI. Requires a new tab in the footer and a new route.

### Export mechanism

```ts
// api.ts
exportData(): string {
  const timestamps = this.getTimeStampData()  // already exists
  const settings = { ...this._settingsData, perDayTagData: this.perDayTagData() }
  const output = { version: 1, exportedAt: new Date().toISOString(), recordCount: timestamps.length, settings, timestamps }
  return JSON.stringify(output, null, 2)
}
```

Trigger download in component:
```ts
const json = api.exportData()
const blob = new Blob([json], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = Object.assign(document.createElement('a'), {
  href: url,
  download: `bible-history-${new Date().toISOString().slice(0, 10)}.json`,
})
a.click()
URL.revokeObjectURL(url)
```

### Import mechanism

```ts
// api.ts
async importData(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text()
  const data = JSON.parse(text)
  // validate version
  if (data.version !== 1) throw new Error(`Unknown export version: ${data.version}`)
  
  let imported = 0, skipped = 0
  for (const { date, book, chapter } of data.timestamps) {
    if (!this.timeStampMap()[book]?.[chapter]?.[date]) {
      await this.markAsRead(book, chapter, date)
      imported++
    } else {
      skipped++
    }
  }
  // replace settings if present
  if (data.settings) { /* apply each settings field */ }
  return { imported, skipped }
}
```

Import UI: `<input type="file" accept=".json">` → read → show confirmation with `{ imported, skipped }` counts before committing (or show result after).

---

## iOS Storage Risk Mitigations

### Call `storage.persist()` on startup

Request durable storage as a best-effort measure on first load. Safari support is partial but harmless to call:

```ts
// index.tsx or App.tsx, once on mount
navigator.storage?.persist?.()
```

### iOS install-to-home-screen prompt

Installed PWAs on iOS get persistent storage exempt from the 7-day inactivity eviction. Show a one-time dismissible prompt on iOS Safari when not installed:

```ts
const isIosSafari = /iP(hone|ad|od)/.test(navigator.userAgent) && /WebKit/.test(navigator.userAgent)
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
```

Store dismissal in `localStorage` (not IndexedDB — `localStorage` is more durable on iOS and survives IndexedDB eviction in practice, though neither is guaranteed).

---

## Open Questions

### Q4 — Show iOS install prompt?

A one-time nudge ("Add to Home Screen to protect your data") on iOS Safari. Low implementation cost, meaningful risk reduction. Recommend yes.

### Q5 — Periodic export reminder?

A monthly in-app nudge to export. Could track last-export date in `localStorage`. Lower priority — can be added later without architectural changes.

---

## Implementation Steps

1. **`data/model.ts`** — Add `ExportFormat` interface matching the JSON structure above.
2. **`data/api.ts`** — Add `exportData()` and `importData(file)` methods.
3. **`data/indexDb.ts`** — No changes needed; `addTimestamp` covers import writes.
4. **`components/AppRouter.tsx`** — Add `/settings` route.
5. **`components/Layout.tsx`** — Add Settings tab to footer nav; optionally add iOS install prompt.
6. **`components/Settings.tsx`** (new) — Export button, import file input, result feedback.
7. **`index.tsx`** — Call `navigator.storage?.persist?.()` on startup.

## Affected Files

| File | Change |
|------|--------|
| `data/model.ts` | Add `ExportFormat` interface |
| `data/api.ts` | Add `exportData()`, `importData()` |
| `utils/groupUtils.ts` | No change |
| `components/AppRouter.tsx` | Add `/settings` route |
| `components/Layout.tsx` | Add Settings tab; iOS install prompt |
| `components/Settings.tsx` | New component: export/import UI |
| `index.tsx` | Call `storage.persist()` on startup |
| `scripts/dump-indexeddb.js` | One-off console script (no app change needed) |
