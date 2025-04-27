import { createSignal, For } from 'solid-js'
import { range } from '../utils/rangeUtils'
import { Chapter } from './Chapter'
import styles from './Book.module.css'

export interface BookProps {
  name: string
  chapterCount: number
  onChange: (value: number) => void
}

export function Book(props: BookProps) {
  const [isExpanded, setIsExpanded] = createSignal(false)

  return (
    <div classList={{ [styles.Book]: true, [styles.isExpanded]: isExpanded() }}>
      <span
        class={styles.label}
        onClick={() => {
          setIsExpanded((prev) => !prev)
        }}>
        {props.name}
        <ion-icon name="chevron-down-sharp"></ion-icon>
      </span>

      <ol class={styles.chapterList}>
        <For each={[...range(1, props.chapterCount)]}>
          {(i) => (
            <li>
              <Chapter
                bookName={props.name}
                number={i}
                initialValue={0}
                onChange={props.onChange}
              />
            </li>
          )}
        </For>
      </ol>
    </div>
  )
}
