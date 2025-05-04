import { createResource, Show, type Component } from 'solid-js'
import { Api } from '../data/api'
import { ApiProvider } from './ApiContext'
import styles from './App.module.css'
import { AppRouter } from './AppRouter'

export const App: Component = () => {
  const [api] = createResource(Api.create)

  return (
    <div class={styles.App}>
      <Show when={api()}>
        <ApiProvider value={api()}>
          <AppRouter />
        </ApiProvider>
      </Show>
    </div>
  )
}
