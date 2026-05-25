import { createSignal, Show, type JSX } from 'solid-js'
import { SearchInput } from './SearchInput'
import { useApi } from './ApiContext'
import styles from './Layout.module.css'
import { A, type RouteSectionProps } from '@solidjs/router'
import { PlanSettings } from './PlanSettings'
import { className } from '../utils/cssUtils'
import { Icon } from './Icon'

const isIosSafari =
  /iP(hone|ad|od)/.test(navigator.userAgent) &&
  /WebKit/.test(navigator.userAgent) &&
  !/(CriOS|FxiOS)/.test(navigator.userAgent)
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
const shouldShowInstallPrompt =
  isIosSafari && !isInstalled && !localStorage.getItem('installPromptDismissed')

export function Layout(props: RouteSectionProps) {
  const api = useApi()
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)
  const [showInstallPrompt, setShowInstallPrompt] = createSignal(shouldShowInstallPrompt)

  const title = () =>
    props.location.pathname.endsWith('/plan')
      ? 'Plan'
      : props.location.pathname.endsWith('/history')
      ? 'History'
      : props.location.pathname.endsWith('/settings')
      ? 'Settings'
      : 'Books'

  const dismissInstallPrompt = () => {
    localStorage.setItem('installPromptDismissed', '1')
    setShowInstallPrompt(false)
  }

  return (
    <div class={styles.Layout}>
      <Show when={showInstallPrompt()}>
        <div class={styles.installPrompt}>
          <span>Add to Home Screen to protect your data</span>
          <button class={styles.installPromptDismiss} onClick={dismissInstallPrompt}>
            ✕
          </button>
        </div>
      </Show>
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
        <A href="/settings" activeClass={styles.activeTab}>
          <Icon name="settings-outline" size="large" />
        </A>
      </footer>
    </div>
  )
}
