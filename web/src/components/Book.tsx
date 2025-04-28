import { createSignal, For, Show } from 'solid-js'
import { range } from '../utils/rangeUtils'
import { Chapter } from './Chapter'
import styles from './Book.module.css'
import accordionStyles from './Accordion.module.css'
import { className } from '../utils/cssUtils'
import type { BibleBookMeta, ChapterID } from '../data/model'

export interface BookProps extends BibleBookMeta {}

export function Book(props: BookProps) {
  const [isExpanded, setIsExpanded] = createSignal(false)

  return (
    <div
      classList={{
        [styles.Book]: true,
        [styles.isExpanded]: isExpanded(),
        [accordionStyles.isExpanded]: isExpanded(),
      }}>
      <span
        class={styles.label}
        onClick={() => {
          setIsExpanded((prev) => !prev)
        }}>
        {props.name}
        <ion-icon
          class={className(styles.chevron, accordionStyles.icon)}
          name="chevron-down-sharp"></ion-icon>
      </span>

      <ol class={className(styles.chapterList, accordionStyles.content)}>
        <Show when={isExpanded()}>
          <For each={[...range(1, props.chapterCount)]}>
            {(i) => (
              <li>
                <Chapter
                  bookName={props.name}
                  abbrev={props.abbrev}
                  number={i as ChapterID}
                  initialValue={0}
                />
              </li>
            )}
          </For>
        </Show>
      </ol>
    </div>
  )
}
