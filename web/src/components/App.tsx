import type { Component } from 'solid-js'

import styles from './App.module.css'
import { BookList } from './BookList'

export const App: Component = () => {
  return (
    <div class={styles.App}>
      <BookList />
    </div>
  )
}
