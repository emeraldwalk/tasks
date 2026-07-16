import { createSignal, For, Show } from 'solid-js'
import { keys } from '../utils/dataUtils'
import { computeGroupStat } from '../utils/groupUtils'
import { useApi } from './ApiContext'
import styles from './PlanSettings.module.css'
import { TagSelector } from './TagSelector'
import { Icon } from './Icon'
import type { PerDayTagData, PlanId, Tag } from '../data/model'

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
  const tagDescriptions = () => api.getTagDescriptions()
  const chapters = api.getChapterData()

  const formatGroupStat = (entry: PerDayTagData) => {
    const stat = computeGroupStat(chapters, tagRecord(), entry, api.targetDays())
    if (stat.poolSize === 0) return 'No chapters match these tags yet'

    const overall = `${stat.poolSize} chapters · ${stat.timesThrough.toFixed(1)}× over ${api.targetDays()} days`
    if (stat.tagStats.length <= 1) return overall

    const perTag = stat.tagStats
      .map((t) => `${t.tag} ${t.timesThrough.toFixed(1)}×`)
      .join(' · ')
    return `${overall} (${perTag})`
  }

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

  const onAddPlan = () => {
    api.addPlan(`Plan ${api.plans().length + 1}`)
  }

  const onRenamePlan = (id: PlanId) => {
    return (e: Event & { target: HTMLInputElement }) => {
      api.renamePlan(id, e.target.value)
    }
  }

  const onSetActivePlan = (id: PlanId) => {
    return () => api.setActivePlanId(id)
  }

  const onRemovePlan = (id: PlanId) => {
    return () => api.removePlan(id)
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
    const url = new URL(import.meta.env.BASE_URL, window.location.origin)
    url.searchParams.set('_r', Date.now().toString())
    window.location.replace(url.toString())
  }

  return (
    <div class={styles.PlanSettings}>
      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Plans</h2>
        <div class={styles.card}>
          <ul class={styles.planList}>
            <For each={api.plans()}>
              {(plan) => (
                <li class={styles.planRow}>
                  <button
                    type="button"
                    class={styles.planActiveToggle}
                    onClick={onSetActivePlan(plan.id)}
                    aria-label={
                      plan.id === api.activePlanId() ? 'Active plan' : 'Set as active plan'
                    }>
                    <Icon
                      name={plan.id === api.activePlanId() ? 'checkmark-circle' : 'ellipse-outline'}
                    />
                  </button>
                  <input
                    class={styles.planNameInput}
                    value={plan.name}
                    onInput={onRenamePlan(plan.id)}
                  />
                  <button
                    type="button"
                    class={styles.removeGroup}
                    disabled={api.plans().length <= 1}
                    onClick={onRemovePlan(plan.id)}
                    aria-label="Delete plan">
                    <Icon name="remove-circle" size="large" />
                  </button>
                </li>
              )}
            </For>
          </ul>
          <button type="button" class={styles.addGroup} onClick={onAddPlan}>
            <Icon name="add-circle" />
            Add Plan
          </button>
        </div>
      </section>

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>Reading Plan — {api.activePlan().name}</h2>
        <div class={styles.card}>
          <ul class={styles.tagGroupList}>
            <For each={api.perDayTagData()}>
              {(datum, i) => (
                <li class={styles.tagGroupRow}>
                  <TagSelector
                    tagNames={tagNames()}
                    tagDescriptions={tagDescriptions()}
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
                  <p class={styles.groupStat}>{formatGroupStat(datum)}</p>
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
