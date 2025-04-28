import { createResource, createSignal, For } from 'solid-js'
import styles from './Chapter.module.css'
import { className } from '../utils/cssUtils'
import accordionStyles from './Accordion.module.css'
import { Api } from '../data/api'
import { now } from '../utils/dateUtils'
import type { BookID, ChapterID } from '../data/model'
import { useApi } from './ApiContext'

export interface ChapterProps {
  bookName: string
  abbrev: BookID
  number: ChapterID
  initialValue: number
  onChange: (value: number) => void
}

export function Chapter(props: ChapterProps) {
  const api = useApi()
  const [isExpanded, setIsExpanded] = createSignal(false)

  const dates = () => {
    return Object.keys(api.getData()[props.abbrev]?.[props.number] ?? {}).map(
      (date) => date.substring(5, 10),
    )
  }

  async function onAdd() {
    await api.markChapterAsRead(props.abbrev, props.number, now())
  }

  return (
    <div
      class={className(
        styles.Chapter,
        isExpanded() && styles.isExpanded,
        isExpanded() && accordionStyles.isExpanded,
      )}>
      <span class={styles.label} onClick={() => setIsExpanded((prev) => !prev)}>
        {props.bookName} {props.number}
        <ion-icon
          class={accordionStyles.icon}
          name="chevron-down-sharp"></ion-icon>
      </span>
      <button onClick={onAdd}>+</button>
      <div class={className(styles.dateList, accordionStyles.content)}>
        <For each={dates()}>
          {(date) => (
            <button class={styles.date} onClick={() => props.onChange(0)}>
              {date}
            </button>
          )}
        </For>
        {/* <button class={styles.date}>04/26</button>
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
            <button class={styles.date}>04/24</button> */}
      </div>
    </div>
  )
}
