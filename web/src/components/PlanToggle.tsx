import { For, Show } from 'solid-js'
import { useApi } from './ApiContext'
import { className } from '../utils/cssUtils'
import styles from './PlanToggle.module.css'

/** iOS-style segmented control for switching the active plan. Hidden when there's only one plan to switch to. */
export function PlanToggle() {
  const api = useApi()

  return (
    <Show when={api.plans().length > 1}>
      <div class={styles.PlanToggle}>
        <div class={styles.track} role="tablist">
          <For each={api.plans()}>
            {(plan) => (
              <button
                type="button"
                role="tab"
                aria-selected={plan.id === api.activePlanId()}
                class={className(
                  styles.segment,
                  plan.id === api.activePlanId() && styles.segmentActive,
                )}
                onClick={() => api.setActivePlanId(plan.id)}>
                {plan.name}
              </button>
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
