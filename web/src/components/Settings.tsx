import { createSignal } from 'solid-js'
import { useApi } from './ApiContext'
import styles from './Settings.module.css'

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

export function Settings() {
  const api = useApi()
  const [importResult, setImportResult] = createSignal<string | null>(null)
  let fileInput: HTMLInputElement | undefined

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
    <div class={styles.Settings}>
      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Data</h2>
        <button class={styles.button} onClick={handleExport}>
          Export
        </button>
        <button class={styles.button} onClick={() => fileInput?.click()}>
          Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json"
          style="display:none"
          onChange={handleImport}
        />
        {importResult() && <p class={styles.importResult}>{importResult()}</p>}
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>About</h2>
        <p class={styles.warning}>
          Before removing this app from your home screen, export your data.
          Deleting the app also deletes all reading history with no way to recover it.
        </p>
      </section>
    </div>
  )
}
