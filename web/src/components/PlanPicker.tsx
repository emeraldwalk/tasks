import { createSignal, For, onCleanup, Show } from 'solid-js'
import { useApi } from './ApiContext'
import { Icon } from './Icon'
import type { PlanId } from '../data/model'
import styles from './PlanPicker.module.css'

/**
 * Secondary "current plan" chip shown above the day list — tapping it opens a
 * checkmarked dropdown menu to switch plans. Scales to any number of plans,
 * unlike a segmented control, while — unlike putting the picker in the page
 * title — leaving the "Plan" title alone as a distinct, secondary control.
 * Renders nothing when there's only one plan to switch to.
 */
export function PlanPicker() {
  const api = useApi()
  const [open, setOpen] = createSignal(false)
  let ref: HTMLDivElement | undefined

  const close = () => setOpen(false)

  const onDocPointerDown = (e: PointerEvent) => {
    if (open() && ref && !ref.contains(e.target as Node)) close()
  }
  document.addEventListener('pointerdown', onDocPointerDown)
  onCleanup(() => document.removeEventListener('pointerdown', onDocPointerDown))

  const onSelect = (id: PlanId) => {
    return () => {
      api.setActivePlanId(id)
      close()
    }
  }

  return (
    <Show when={api.plans().length > 1}>
      <div class={styles.PlanPicker} ref={ref}>
        <button
          type="button"
          class={styles.chip}
          aria-haspopup="menu"
          aria-expanded={open()}
          onClick={() => setOpen((o) => !o)}>
          <span class={styles.chipLabel}>{api.activePlan().name}</span>
          <Icon class={styles.chevron} name="chevron-down-sharp" />
        </button>
        <Show when={open()}>
          <ul class={styles.menu} role="menu">
            <For each={api.plans()}>
              {(plan) => (
                <li
                  role="menuitemradio"
                  aria-checked={plan.id === api.activePlanId()}
                  class={styles.menuItem}
                  onClick={onSelect(plan.id)}>
                  <span class={styles.menuItemName}>{plan.name}</span>
                  <Show when={plan.id === api.activePlanId()}>
                    <Icon name="checkmark-circle" />
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </Show>
  )
}
