import { createResource, Show, type Component } from 'solid-js'
import { Route, Router } from '@solidjs/router'
import { Api } from '../data/api'
import { ApiProvider } from './ApiContext'
import styles from './App.module.css'
import { Layout } from './Layout'
import { ChapterGroupList } from './ChapterGroupList'
import { HistoryList } from './HistoryList'

export const App: Component = () => {
  const [api] = createResource(Api.create)

  return (
    <div class={styles.App}>
      <Show when={api()}>
        <ApiProvider value={api()}>
          <Router base={import.meta.env.BASE_URL} root={Layout}>
            <Route path="/" component={ChapterGroupList} />
            <Route path="/plan" component={ChapterGroupList} />
            <Route path="/history" component={HistoryList} />
          </Router>
        </ApiProvider>
      </Show>
    </div>
  )
}
