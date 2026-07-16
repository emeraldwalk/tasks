import { createSignal, For, onCleanup, Show } from 'solid-js'
import { useApi } from './ApiContext'
import { Icon } from './Icon'
import type { PlanId } from '../data/model'
import styles from './PlanPicker.module.css'

/**
 * iOS-style "tap the title to switch context" menu — the pattern Mail uses for
 * its inbox picker and Reminders uses for its list picker. Scales to any
 * number of plans, unlike a segmented control which runs out of width fast.
 * Caller is expected to only render this when there's more than one plan.
 */
export function PlanPicker() {
  const api = useApi()
  const [open, setOpen] = createSignal(false)
  let ref: HTMLSpanElement | undefined

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
    <span class={styles.PlanPicker} ref={ref}>
      <button
        type="button"
        class={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open()}
        onClick={() => setOpen((o) => !o)}>
        <span class={styles.triggerLabel}>{api.activePlan().name}</span>
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
    </span>
  )
}
