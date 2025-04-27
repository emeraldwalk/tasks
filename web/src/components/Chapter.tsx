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
        <ion-icon name="chevron-down-sharp"></ion-icon>
      </span>
      <button>+</button>
      <div class={styles.dateList}>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
        <button class={styles.date}>04/26</button>
        <button class={styles.date}>04/24</button>
      </div>
    </div>
  )
}
