/**
 * Bible history dump script — paste into browser DevTools console
 * while the app is open (emeraldwalk.github.io/tasks/).
 *
 * HOW TO RUN ON iPhone DATA:
 *
 *   Option A — Mac Safari Web Inspector (recommended)
 *   1. On iPhone: Settings > Safari > Advanced > Web Inspector ON
 *   2. Connect iPhone to Mac via USB, trust the connection
 *   3. Open the app in Safari on iPhone
 *   4. On Mac: Safari > Develop > [your iPhone] > emeraldwalk.github.io/tasks/
 *   5. Paste this script into the Console tab and press Enter
 *   6. A download is triggered on the iPhone (saves to Files > Downloads)
 *      AND the JSON is printed to the Mac console so you can copy it from there
 *
 *   Option B — Mac Safari directly
 *   If you have ever used the app in Safari on Mac (same origin, same browser),
 *   open the app at emeraldwalk.github.io/tasks/ in Mac Safari and paste there.
 *   Note: Mac Safari and iPhone Safari have separate IndexedDB storage — only
 *   do this if your reading data is on Mac.
 *
 *   Option C — Chrome DevTools (Mac or desktop)
 *   Same as Option B but for Chrome. Chrome remote debugging for Android is
 *   available; for iOS use Option A.
 */

(async () => {
  const DB_NAME = 'BibleReadDB'
  const DB_VERSION = 2

  // Open the database read-only
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
    // Don't handle onupgradeneeded — if the DB doesn't exist we want to fail
  })

  // Read all timestamp records
  const rawTimestamps = await new Promise((resolve, reject) => {
    const tx = db.transaction(['timestamps'], 'readonly')
    const req = tx.objectStore('timestamps').getAll()
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })

  // Read settings singleton
  const rawSettings = await new Promise((resolve, reject) => {
    const tx = db.transaction(['settings'], 'readonly')
    const req = tx.objectStore('settings').get('1')
    req.onsuccess = (e) => resolve(e.target.result ?? null)
    req.onerror = (e) => reject(e.target.error)
  })

  // Parse timestamp keys: "ISODateTime_BookAbbrev_ChapterNumber"
  const timestamps = rawTimestamps.map(({ id }) => {
    const firstUnderscore = id.indexOf('_')
    const rest = id.slice(firstUnderscore + 1)
    const lastUnderscore = rest.lastIndexOf('_')
    return {
      date: id.slice(0, firstUnderscore),
      book: rest.slice(0, lastUnderscore),
      chapter: parseInt(rest.slice(lastUnderscore + 1), 10),
    }
  })

  const output = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recordCount: timestamps.length,
    settings: rawSettings,
    timestamps,
  }

  const json = JSON.stringify(output, null, 2)

  // Attempt file download (goes to iPhone Files > Downloads, or Mac Downloads)
  try {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bible-history-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    console.log('Download triggered.')
  } catch (e) {
    console.warn('Download failed, copy the JSON below manually:', e.message)
  }

  // Always log so you can copy from Mac DevTools console if download doesn't land
  console.log(`Records: ${timestamps.length}`)
  console.log('=== COPY FROM HERE ===')
  console.log(json)
  console.log('=== COPY TO HERE ===')

  db.close()
  return output
})()
