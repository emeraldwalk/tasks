import { createSignal, Show, type JSX } from 'solid-js'
import { SearchInput } from './SearchInput'
import { useApi } from './ApiContext'
import styles from './Layout.module.css'
import { A, type RouteSectionProps } from '@solidjs/router'
import { PlanSettings } from './PlanSettings'
import { className } from '../utils/cssUtils'
import { Icon } from './Icon'

export function Layout(props: RouteSectionProps) {
  const api = useApi()
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)
  const title = () =>
    props.location.pathname.endsWith('/plan')
      ? 'Plan'
      : props.location.pathname.endsWith('/history')
      ? 'History'
      : 'Books'
  return (
    <div class={styles.Layout}>
      <header class={styles.header}>
        <h1 class={styles.title}>{title()}</h1>
        <span
          class={className(
            styles.menuTrigger,
            isSettingsOpen() && styles.isSettingsOpen,
          )}
          onClick={() => {
            setIsSettingsOpen(!isSettingsOpen())
          }}>
          <Icon name={isSettingsOpen() ? 'close' : 'menu'} size="large" />
        </span>
        <label class={styles.showCompleted}>
          <input
            type="checkbox"
            checked={api.showCompleted()}
            onChange={() => api.toggleShowCompleted()}
          />
          Completed
        </label>
        <SearchInput class={styles.search} onSearch={api.setSearchText} />
      </header>
      <Show when={isSettingsOpen()}>
        <aside class={styles.sidebar}>
          <PlanSettings />
        </aside>
      </Show>
      <main class={styles.main}>{props.children}</main>
      <footer class={styles.tabBar}>
        <A href="/" end activeClass={styles.activeTab}>
          <Icon name="book-outline" size="large" />
        </A>
        <A href="/plan" activeClass={styles.activeTab}>
          <Icon name="list-outline" size="large" />
        </A>
        <A href="/history" activeClass={styles.activeTab}>
          <Icon name="time-outline" size="large" />
        </A>
      </footer>
    </div>
  )
}
