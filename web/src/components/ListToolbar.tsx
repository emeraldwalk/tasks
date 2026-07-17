import { Show } from 'solid-js'
import { useApi } from './ApiContext'
import { PlanPicker } from './PlanPicker'
import styles from './ListToolbar.module.css'

export interface ListToolbarProps {
  showPlanPicker?: boolean
}

/** Secondary bar above a chapter list — the plan picker chip (Plan view only) plus the Completed checkbox, both previously in the header. */
export function ListToolbar(props: ListToolbarProps) {
  const api = useApi()

  return (
    <div class={styles.ListToolbar}>
      <Show when={props.showPlanPicker}>
        <PlanPicker />
      </Show>
      <label class={styles.showCompleted}>
        <input
          type="checkbox"
          checked={api.showCompleted()}
          onChange={() => api.toggleShowCompleted()}
        />
        Completed
      </label>
    </div>
  )
}
