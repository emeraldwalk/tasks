import { createResource, Show, type Component } from 'solid-js'
import { Api } from '../data/api'
import { ApiProvider } from './ApiContext'
import styles from './App.module.css'
import { Layout } from './Layout'
import { Route, Router } from '@solidjs/router'
import { ChapterGroupList } from './ChapterGroupList'
import { PlaySettings } from './PlanSettings'

export const App: Component = () => {
  const [api] = createResource(Api.create)

  return (
    <div class={styles.App}>
      <Show when={api()}>
        <ApiProvider value={api()}>
          <Router base={import.meta.env.BASE_URL} root={Layout}>
            <Route path="/" component={ChapterGroupList} />
            <Route path="/settings" component={PlaySettings} />
          </Router>
        </ApiProvider>
      </Show>
    </div>
  )
}
