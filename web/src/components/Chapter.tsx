import { createSignal } from 'solid-js'
import styles from './Chapter.module.css'
import { className } from '../utils/cssUtils'
import accordionStyles from './Accordion.module.css'

export interface ChapterProps {
  bookName: string
  number: number
  initialValue: number
  onChange: (value: number) => void
}

export function Chapter(props: ChapterProps) {
  const [isExpanded, setIsExpanded] = createSignal(false)

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
      <button>+</button>
      <div class={className(styles.dateList, accordionStyles.content)}>
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
