import { createResource, Show, type Component } from 'solid-js'

import styles from './App.module.css'
import { ChapterGroupList } from './ChapterGroupList'
import { Api } from '../data/api'
import { ApiProvider } from './ApiContext'

export const App: Component = () => {
  const [api] = createResource(Api.create)

  return (
    <div class={styles.App}>
      <Show when={api()}>
        <ApiProvider value={api()}>
          <ChapterGroupList />
        </ApiProvider>
      </Show>
    </div>
  )
}
