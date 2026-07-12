import { createSignal, For, Show } from 'solid-js'
import { keys } from '../utils/dataUtils'
import { useApi } from './ApiContext'
import styles from './PlanSettings.module.css'
import { TagSelector } from './TagSelector'
import { Icon } from './Icon'
import type { PerDayTagData, Tag } from '../data/model'

async function triggerExport(json: string, filename: string): Promise<void> {
  const file = new File([json], filename, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Bible reading backup' })
  } else {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    a.click()
    URL.revokeObjectURL(url)
  }
}

export function PlanSettings() {
  const api = useApi()
  const [importResult, setImportResult] = createSignal<string | null>(null)
  const [reloadResult, setReloadResult] = createSignal<string | null>(null)
  let fileInput: HTMLInputElement | undefined

  const tagRecord = () => api.getTags()
  const tagNames = () => keys(tagRecord())

  const onChange = (i: number) => {
    return (value: PerDayTagData) => {
      api.setPerDayTagData((prev) => {
        const newData = [...prev]
        newData[i] = value
        return newData
      })
    }
  }

  const onAddGroup = () => {
    api.setPerDayTagData((prev) => [...prev, { tags: [], count: 1 }])
  }

  const onRemoveGroup = (i: number) => {
    return () => {
      api.setPerDayTagData((prev) => prev.filter((_, idx) => idx !== i))
    }
  }

  const handleExport = async () => {
    const json = api.exportData()
    const filename = `bible-history-${new Date().toISOString().slice(0, 10)}.json`
    await triggerExport(json, filename)
  }

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      const { imported, skipped } = await api.importData(file)
      setImportResult(`Imported ${imported} records. ${skipped} already existed.`)
    } catch (err) {
      setImportResult(`Error: ${err instanceof Error ? err.message : String(err)}`)
    }
    input.value = ''
  }

  const handleReloadContent = async () => {
    setReloadResult('Clearing cached content…')
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
    }
    const url = new URL(window.location.href)
    url.searchParams.set('_r', Date.now().toString())
    window.location.replace(url.toString())
  }

  return (
    <div class={styles.PlanSettings}>
      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Reading Plan</h2>
        <div class={styles.card}>
          <ul class={styles.tagGroupList}>
            <For each={api.perDayTagData()}>
              {(datum, i) => (
                <li class={styles.tagGroupRow}>
                  <TagSelector
                    tagNames={tagNames()}
                    value={datum}
                    onChange={onChange(i())}
                  />
                  <button
                    type="button"
                    class={styles.removeGroup}
                    onClick={onRemoveGroup(i())}
                    aria-label="Remove group">
                    <Icon name="remove-circle" size="large" />
                  </button>
                </li>
              )}
            </For>
          </ul>
          <button type="button" class={styles.addGroup} onClick={onAddGroup}>
            <Icon name="add-circle" />
            Add Group
          </button>
        </div>

        <div class={styles.card}>
          <label class={styles.fieldRow}>
            <span>Target days</span>
            <input
              type="number"
              min={1}
              value={api.targetDays()}
              onInput={(e) => api.setTargetDays(+e.target.value)}
            />
          </label>
        </div>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Cutoff</h2>
        <div class={styles.card}>
          <label class={styles.fieldRow}>
            <span>Days</span>
            <input
              type="number"
              min={1}
              value={api.cutoffDays() ?? ''}
              onInput={(e) => {
                const v = e.target.value
                api.setCutoffDays(v === '' ? null : +v)
              }}
            />
          </label>
          <label class={styles.fieldRow}>
            <span>Date</span>
            <input
              type="date"
              value={api.cutoffDate() ?? ''}
              onInput={(e) => {
                const v = e.target.value
                api.setCutoffDate(v === '' ? null : v)
              }}
            />
          </label>
          <label class={styles.fieldRow}>
            <span>Show full history</span>
            <input
              type="checkbox"
              checked={api.showAllDates()}
              onChange={() => api.setShowAllDates(!api.showAllDates())}
            />
          </label>
        </div>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Data</h2>
        <div class={styles.card}>
          <div class={styles.dataButtons}>
            <button class={styles.button} onClick={handleExport}>Export</button>
            <button class={styles.button} onClick={() => fileInput?.click()}>Import</button>
            <input ref={fileInput} type="file" accept=".json" style="display:none" onChange={handleImport} />
          </div>
          <Show when={importResult()}>
            <p class={styles.importResult}>{importResult()}</p>
          </Show>
        </div>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>App</h2>
        <div class={styles.card}>
          <div class={styles.dataButtons}>
            <button class={styles.button} onClick={handleReloadContent}>Reload Content</button>
          </div>
          <Show when={reloadResult()}>
            <p class={styles.importResult}>{reloadResult()}</p>
          </Show>
        </div>
      </section>
    </div>
  )
}
