# Plan: Data Backup & Export

## Implementation order

This plan is **standalone** — implement it before any other plan. Getting a backup mechanism in place first means there is a recovery path before any other code changes touch `indexDb.ts`.

When `plan-settings-and-cutoff.md` is later implemented, its new `SettingsData` fields (`targetDays`, `cutoffDays`, `cutoffDate`) will be included in future exports automatically — `exportData()` spreads `_settingsData` so no changes to this plan's code are needed.

---

## Problem

All reading history lives in IndexedDB (`BibleReadDB`) in the browser. This data can be lost:

- **Removing the app from the home screen** — deletes all IndexedDB data immediately, no warning, no recovery. Unlike native apps, PWA uninstall is destructive.
- **iOS/Safari storage eviction** — Safari can evict origin storage under low-storage conditions.
- Settings → Safari → Clear History and Website Data
- Settings → Safari → Advanced → Website Data → deleting the `emeraldwalk.github.io` entry
- Device wipe, factory reset, or migration to a new device

**Note — deploying new app code is not a risk in itself.** GitHub Pages deployment only swaps static files on a server; the browser does not wipe IndexedDB when it downloads new JavaScript. The only code-side risk is a bug in `indexDb.ts` that drops or renames existing stores — which must be guarded carefully in any future schema changes.

---

## Immediate One-Off Dump (No App Changes Required)

A console script at `scripts/dump-indexeddb.js` can be pasted into browser DevTools while the app is open.

### How to run on iPhone data

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

### Export file format

The `settings` block contains whatever fields exist in `SettingsData` at the time. Before `plan-settings-and-cutoff` is implemented this will be:

```json
{
  "version": 1,
  "exportedAt": "2025-05-24T12:00:00.000Z",
  "recordCount": 412,
  "settings": {
    "showCompleted": true,
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

After `plan-settings-and-cutoff` is implemented, `targetDays`, `cutoffDays`, and `cutoffDate` will appear in `settings` automatically. The `version` field guards against future format breaks — import logic can branch on it.

### Where the export goes

**iOS PWA (installed to home screen — the primary use case):** The `<a download>` trick does not reliably trigger a file download in standalone PWA mode on iOS — there is no Safari download manager UI available. Instead, use `navigator.share()` to open the native iOS share sheet. From the share sheet the user can save to Files, Notes, email it to themselves, AirDrop it to a Mac, etc.

**Desktop browsers (Chrome, Firefox, Safari on Mac):** `<a download>` works normally and the file goes to the browser's downloads folder. `navigator.share()` is not widely supported on desktop so fall back to `<a download>`.

The export function must detect which path to take:

```ts
async function triggerExport(json: string, filename: string): Promise<void> {
  const file = new File([json], filename, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    // iOS PWA and iOS Safari — opens native share sheet
    await navigator.share({ files: [file], title: 'Bible reading backup' })
  } else {
    // Desktop browsers
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    a.click()
    URL.revokeObjectURL(url)
  }
}
```

Call this from the Settings component's Export button:

```ts
const json = api.exportData()
const filename = `bible-history-${new Date().toISOString().slice(0, 10)}.json`
await triggerExport(json, filename)
```

### Export method (`api.ts`)

```ts
exportData(): string {
  const timestamps = this.getTimeStampData()  // already exists
  const settings = { ...this._settingsData, perDayTagData: this.perDayTagData() }
  const output = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recordCount: timestamps.length,
    settings,
    timestamps,
  }
  return JSON.stringify(output, null, 2)
}
```

### Import method (`api.ts`)

Import merges timestamps (deduplicates by key) and replaces settings. Apply only settings fields that have setters — unknown fields from future versions are silently ignored.

```ts
async importData(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text()
  const data = JSON.parse(text)
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

  if (data.settings) {
    const s = data.settings
    // Apply only fields that exist in the current SettingsData shape.
    // Fields added by later plans (targetDays, cutoffDays, cutoffDate)
    // are handled here once those plans are implemented.
    if (s.showCompleted != null) await this.setShowCompleted(s.showCompleted)
    if (Array.isArray(s.perDayTagData)) this.setPerDayTagData(s.perDayTagData)
  }

  return { imported, skipped }
}
```

Note: `setShowCompleted` does not currently exist as a standalone setter — `toggleShowCompleted` only toggles. Add a `setShowCompleted(value: boolean)` method to `Api` that sets the signal directly and persists to IndexedDB.

Import UI: `<input type="file" accept=".json">` hidden, triggered by a visible "Import" button. After completion, show inline text: *"Imported 412 records. 3 already existed."* On error (bad version, invalid JSON), show the error message inline. No modal needed.

---

## iOS Storage Risk Mitigations

### Call `storage.persist()` on startup

Best-effort request for durable storage. For an installed PWA on modern iOS this returns `true` immediately, but worth calling for non-installed contexts:

```ts
// index.tsx or App.tsx, once on mount
navigator.storage?.persist?.()
```

### iOS install-to-home-screen prompt

Show a one-time dismissible banner on iOS Safari when not installed as a PWA. Store the dismissal flag in `localStorage` under key `installPromptDismissed` (not IndexedDB — `localStorage` is slightly more durable in practice).

```ts
const isIosSafari = /iP(hone|ad|od)/.test(navigator.userAgent)
  && /WebKit/.test(navigator.userAgent)
  && !/(CriOS|FxiOS)/.test(navigator.userAgent)
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
const showPrompt = isIosSafari && !isInstalled
  && !localStorage.getItem('installPromptDismissed')
```

---

## Implementation Steps

1. **`data/model.ts`** — Add `ExportFormat` interface matching the JSON structure above.

2. **`data/api.ts`** — Add:
   - `exportData(): string`
   - `async importData(file: File): Promise<{ imported: number; skipped: number }>`
   - `async setShowCompleted(value: boolean)` — sets signal and persists (complement to the existing `toggleShowCompleted`)

3. **`data/indexDb.ts`** — No changes needed; `addTimestamp` covers import writes, and `updateSettings` covers settings persistence.

4. **`components/AppRouter.tsx`** — Add `/settings` route.

5. **`components/Layout.tsx`** — Add a fourth Settings tab to the footer nav using the `settings-outline` Ionicons icon (same pattern as the existing three tabs). Add the iOS install prompt banner: detect iOS Safari + not installed + not dismissed, render a dismissible strip with "Add to Home Screen to protect your data" and a dismiss button that sets `localStorage.setItem('installPromptDismissed', '1')`.

6. **`components/Settings.tsx`** (new) — Two sections:
   - **Data**: Export button (calls `triggerExport`), Import button (triggers hidden file input), inline result/error text below the import button.
   - **About**: Static always-visible warning: *"Before removing this app from your home screen, export your data. Deleting the app also deletes all reading history with no way to recover it."*

7. **`index.tsx`** — Call `navigator.storage?.persist?.()` on startup.

---

## Affected Files

| File | Change |
|------|--------|
| `data/model.ts` | Add `ExportFormat` interface |
| `data/api.ts` | Add `exportData()`, `importData()`, `setShowCompleted()` |
| `data/indexDb.ts` | No change |
| `components/AppRouter.tsx` | Add `/settings` route |
| `components/Layout.tsx` | Add Settings tab; iOS install prompt |
| `components/Settings.tsx` | New component: export/import UI and data loss warning |
| `index.tsx` | Call `storage.persist()` on startup |
| `scripts/dump-indexeddb.js` | One-off console script (no app change needed) |
