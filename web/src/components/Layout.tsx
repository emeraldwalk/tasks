import { createSignal, Show, type JSX } from 'solid-js'
import { SearchInput } from './SearchInput'
import { useApi } from './ApiContext'
import styles from './Layout.module.css'
import { A } from '@solidjs/router'
import { PlanSettings } from './PlanSettings'
import { className } from '../utils/cssUtils'

export interface LayoutProps {
  children?: JSX.Element
}

export function Layout(props: LayoutProps) {
  const api = useApi()
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)

  return (
    <div class={styles.Layout}>
      <header class={styles.header}>
        <h1 class={styles.title}>Chapter Plan</h1>
        <span
          class={className(
            styles.menuTrigger,
            isSettingsOpen() && styles.isSettingsOpen,
          )}
          onClick={() => {
            setIsSettingsOpen(!isSettingsOpen())
          }}>
          <ion-icon
            name={isSettingsOpen() ? 'close' : 'menu'}
            size="large"></ion-icon>
        </span>
        <SearchInput class={styles.search} onSearch={api.setSearchText} />
        <label class={styles.showCompleted}>
          <input
            type="checkbox"
            checked={api.showCompleted()}
            onChange={() => api.toggleShowCompleted()}
          />
          Show Completed
        </label>
      </header>
      <Show when={isSettingsOpen()}>
        <aside class={styles.sidebar}>
          <PlanSettings />
        </aside>
      </Show>
      <main class={styles.main}>{props.children}</main>
      <footer class={styles.tabBar}>
        <A href="/" end activeClass={styles.activeTab}>
          <ion-icon name="book-outline" size="large"></ion-icon>
        </A>
        <A href="/plan" activeClass={styles.activeTab}>
          <ion-icon name="list-outline" size="large"></ion-icon>
        </A>
        <A href="/history" activeClass={styles.activeTab}>
          <ion-icon name="time-outline" size="large"></ion-icon>
        </A>
      </footer>
    </div>
  )
}
