import { createSignal, For, Show } from 'solid-js'
import type { ChapterGroupData } from '../data/model'
import styles from './ChapterGroup.module.css'
import accordionStyles from './Accordion.module.css'
import { className } from '../utils/cssUtils'
import { Chapter } from './Chapter'

export interface ChapterGroupProps {
  data: ChapterGroupData
}

export function ChapterGroup(props: ChapterGroupProps) {
  const [isExpanded, setIsExpanded] = createSignal(false)

  return (
    <div
      classList={{
        [styles.ChapterGroup]: true,
        [styles.isExpanded]: isExpanded(),
        [accordionStyles.isExpanded]: isExpanded(),
      }}>
      <span
        class={styles.label}
        onClick={() => {
          setIsExpanded((prev) => !prev)
        }}>
        {props.data.name}
        <ion-icon
          class={accordionStyles.icon}
          name="chevron-down-sharp"></ion-icon>
      </span>

      <ol class={className(styles.chapterList, accordionStyles.content)}>
        <Show when={isExpanded()}>
          <For each={props.data.chapters}>
            {({ name, abbrev, number }) => (
              <li>
                <Chapter
                  bookName={name}
                  abbrev={abbrev}
                  number={number}
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
