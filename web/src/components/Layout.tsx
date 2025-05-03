import { createSignal, Show, type JSX } from 'solid-js'
import { SearchInput } from './SearchInput'
import { useApi } from './ApiContext'
import styles from './Layout.module.css'
import { A, useLocation } from '@solidjs/router'
import { PlanSettings } from './PlanSettings'

export interface LayoutProps {
  children?: JSX.Element
}

export function Layout(props: LayoutProps) {
  const api = useApi()
  const location = useLocation()
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)

  const isSettings = () => location.pathname.endsWith('/settings')

  return (
    <div class={styles.Layout}>
      <header class={styles.header}>
        {/* {isSettings() ? (
          <A href="/">
            <ion-icon name="close" size="large"></ion-icon>
          </A>
        ) : (
          <A href="/settings">
            <ion-icon name="menu" size="large"></ion-icon>
          </A>
        )} */}
        <span
          class={styles.menuTrigger}
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
        <div>
          <aside class={styles.sidebar}>
            <PlanSettings />
          </aside>
        </div>
      </Show>
      <main class={styles.main}>{props.children}</main>
      <footer class={styles.tabBar}>
        <A href="/">
          <ion-icon name="book-outline" size="large"></ion-icon>
        </A>
        <A href="/plan">
          <ion-icon name="list-outline" size="large"></ion-icon>
        </A>
        <A href="/history">
          <ion-icon name="time-outline" size="large"></ion-icon>
        </A>
      </footer>
    </div>
  )
}
