import { createEffect, createSignal } from 'solid-js'
import styles from './Chapter.module.css'

export interface ChapterProps {
  bookName: string
  number: number
  initialValue: number
  onChange: (value: number) => void
}

export function Chapter(props: ChapterProps) {
  return (
    <div class={styles.Chapter}>
      <span class={styles.label}>
        {props.bookName} {props.number}
      </span>
      <button>+</button>
      <div class={styles.dateList}>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
        <span class={styles.date}>04/26</span>
        <span class={styles.date}>04/24</span>
      </div>
    </div>
  )
}
