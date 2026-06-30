import { createSignal, For } from 'solid-js'
import { keys } from '../utils/dataUtils'
import { useApi } from './ApiContext'
import styles from './PlanSettings.module.css'
import { TagSelector } from './TagSelector'
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

  return (
    <div class={styles.PlanSettings}>
      <h1>Plan Settings</h1>

      <ul class={styles.tagGroupList}>
        <For each={api.perDayTagData()}>
          {(datum, i) => (
            <li>
              <TagSelector
                tagNames={tagNames()}
                value={datum}
                onChange={onChange(i())}
              />
            </li>
          )}
        </For>
      </ul>

      <section class={styles.cutoffSection}>
        <label>
          Target days:
          <input
            type="number"
            min={1}
            value={api.targetDays()}
            onInput={(e) => api.setTargetDays(+e.target.value)}
          />
        </label>
        <label>
          Cutoff (days):
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
        <label>
          Cutoff (date):
          <input
            type="date"
            value={api.cutoffDate() ?? ''}
            onInput={(e) => {
              const v = e.target.value
              api.setCutoffDate(v === '' ? null : v)
            }}
          />
        </label>
      </section>

      <section class={styles.dataSection}>
        <h2>Data</h2>
        <div class={styles.dataButtons}>
          <button class={styles.button} onClick={handleExport}>Export</button>
          <button class={styles.button} onClick={() => fileInput?.click()}>Import</button>
          <input ref={fileInput} type="file" accept=".json" style="display:none" onChange={handleImport} />
        </div>
        {importResult() && <p class={styles.importResult}>{importResult()}</p>}
      </section>
    </div>
  )
}
