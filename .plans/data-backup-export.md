# Plan: Data Backup & Export

## Problem

All reading history lives in IndexedDB (`BibleReadDB`) in the browser. This data can be lost:

- **iOS/Safari storage eviction**: Safari can evict origin storage under low-storage conditions. PWAs not installed to the home screen receive the least protection (7-day inactivity eviction applies in some iOS versions).
- **Browser data cleared**: User clears site data or browser history.
- **Device replacement**: Moving to a new phone with no data migration.
- **Browser switch**: Moving from Safari to Chrome or vice versa.

**Note — republishing is not a risk.** Deploying new app code to GitHub Pages does not affect IndexedDB. The database is tied to the origin (`emeraldwalk.github.io`), not the app files. The only code-side risk is a bad schema migration in `indexDb.ts` (renaming the database or dropping stores in `onupgradeneeded`), which must be guarded carefully when adding new fields.

---

## Proposed Solution: Manual Export / Import

A simple JSON export lets the user download a snapshot of their data and restore it later. No backend or third-party service required — consistent with the app's static, offline-first design.

### Export

Serializes all IndexedDB data to a JSON file and triggers a browser download.

**Export format:**

```json
{
  "version": 1,
  "exportedAt": "2025-05-24T12:00:00.000Z",
  "timestamps": [
    { "date": "2025-01-01T08:00:00.000Z", "book": "GEN", "chapter": 1 },
    { "date": "2025-01-01T08:05:00.000Z", "book": "MAT", "chapter": 1 }
  ],
  "settings": {
    "showCompleted": true,
    "targetDays": 365,
    "cutoffDays": null,
    "cutoffDate": null,
    "perDayTagData": [
      { "tags": ["OT"], "count": 3 },
      { "tags": ["NT"], "count": 2 }
    ]
  }
}
```

The `version` field guards against future format changes.

**Mechanism:** Use `URL.createObjectURL(new Blob([json], { type: 'application/json' }))` and a programmatically clicked `<a download="bible-history-YYYY-MM-DD.json">`. No server involved.

### Import

Reads a previously exported JSON file and writes its contents into IndexedDB.

**Import behavior options (see Questions):**

- **Merge**: Timestamps are unioned with existing data (same key = deduplicated). Settings are replaced. Safest — no accidental wipe.
- **Replace**: All existing timestamps deleted first, then import applied. Simpler to implement and reason about.

**Mechanism:** `<input type="file" accept=".json">` → `FileReader` → parse → validate `version` field → write to IndexedDB via existing `addTimestamp` calls (merge) or a new bulk-replace path.

---

## iOS-Specific Considerations

### Install to home screen

When installed as a PWA (Add to Home Screen), iOS grants the app persistent storage that is exempt from the 7-day inactivity eviction applied to regular browser tabs. The app already has a web manifest (`site.webmanifest`) and icons configured.

**Recommendation:** Add a soft prompt in the app (dismissible, shown once) that explains the storage risk and suggests installing to the home screen. Only show it on iOS Safari where the risk is highest.

Detection:

```ts
const isIosSafari = /iP(hone|ad|od)/.test(navigator.userAgent) && /WebKit/.test(navigator.userAgent)
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
const shouldPrompt = isIosSafari && !isInstalled
```

### Storage persistence API

Modern browsers support `navigator.storage.persist()` which requests durable storage (prevents eviction). Safari added partial support but it is not reliable on iOS. Worth calling on startup as a best-effort measure:

```ts
if (navigator.storage?.persist) {
  navigator.storage.persist()  // fire-and-forget; no UI needed
}
```

---

## UI Placement

Export and Import controls belong in the `PlanSettings` sidebar (the only existing settings surface) or in a new dedicated Settings route. 

Two options (see Questions):

**Option A — In the existing sidebar (`PlanSettings`):**
```
[Export history]   [Import]
```
Low friction to add, but the sidebar is already plan-focused.

**Option B — New `/settings` route:**
Separates data management from plan configuration. Requires a new tab in the footer nav and a new route.

---

## Open Questions

### Q1 — Import behavior: merge or replace?

- **Merge** is safer for the user (can't accidentally wipe data) but requires deduplication logic on import.
- **Replace** is simpler and predictable ("this file is now my data") but risks data loss if the user imports an old backup.

Recommendation: merge, since the timestamp key is already a natural deduplicator (`date_book_chapter`).

### Q2 — Settings included in export?

Should the export file include settings (`showCompleted`, `perDayTagData`, `targetDays`, cutoff fields) or just timestamps?

- **Timestamps only**: Simpler; settings are easy to re-configure; avoids restoring stale plan config.
- **Everything**: Full restore to a known state; more useful after a device wipe.

### Q3 — Export/import UI location: sidebar or new settings route?

See options above. A new `/settings` route is cleaner long-term but more work now.

### Q4 — iOS install prompt?

Show a one-time prompt on iOS Safari (non-installed) suggesting the user add to home screen? Would need a dismissal flag stored in `localStorage` (not IndexedDB, to survive a storage eviction).

### Q5 — Backup reminder?

Should the app show a periodic reminder (e.g., once a month) to export? Could be based on last-export timestamp stored in `localStorage`.

---

## Affected Files

| File | Change |
|------|--------|
| `data/api.ts` | Add `exportData()` and `importData(file)` methods |
| `data/indexDb.ts` | Add `getAllTimestamps()` for export; add bulk-write path for import |
| `data/model.ts` | Add `ExportFormat` interface |
| `components/PlanSettings.tsx` | Add export/import buttons (if sidebar approach) |
| `components/Layout.tsx` | Add iOS install prompt (if Q4 = yes) |
| `index.tsx` or `App.tsx` | Call `navigator.storage.persist()` on startup |
| `components/AppRouter.tsx` | Add `/settings` route (if new route approach) |
