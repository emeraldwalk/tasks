import { createSignal, For } from 'solid-js'
import { keys } from '../utils/dataUtils'
import { useApi } from './ApiContext'
import styles from './PlanSettings.module.css'
import { TagSelector } from './TagSelector'
import type { PerDayTagData, Tag } from '../data/model'

export function PlaySettings() {
  const api = useApi()

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
    </div>
  )
}
