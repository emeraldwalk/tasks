import { createSignal, For, Show } from 'solid-js'
import type { ChapterGroupData } from '../data/model'
import styles from './ChapterGroup.module.css'
import accordionStyles from './Accordion.module.css'
import { className } from '../utils/cssUtils'
import { Chapter } from './Chapter'
import { useApi } from './ApiContext'

export interface ChapterGroupProps {
  data: ChapterGroupData
}

export function ChapterGroup(props: ChapterGroupProps) {
  const api = useApi()
  const [isExpanded, setIsExpanded] = createSignal(false)

  const [completedCount, setCompletedCount] = createSignal(
    api.getCompletedChapterCount(props.data.chapters),
  )

  const completedCountLabel = () =>
    completedCount() > 0
      ? `(${completedCount()} / ${props.data.chapters.length})`
      : ''

  function onChapterChange() {
    const count = api.getCompletedChapterCount(props.data.chapters)
    setCompletedCount(count)
  }

  return (
    <div
      classList={{
        [styles.ChapterGroup]: true,
        [styles.isExpanded]: isExpanded(),
        [accordionStyles.isExpanded]: isExpanded(),
      }}>
      <span
        class={styles.header}
        onClick={() => {
          setIsExpanded((prev) => !prev)
        }}>
        <span class={styles.label}>{props.data.name}</span>
        {completedCountLabel()}
        <ion-icon
          class={accordionStyles.icon}
          name="chevron-down-sharp"></ion-icon>
      </span>

      <ol class={className(styles.chapterList, accordionStyles.content)}>
        <Show when={isExpanded()}>
          <For each={props.data.chapters}>
            {(chapter) => (
              <li>
                <Chapter data={chapter} onChange={onChapterChange} />
              </li>
            )}
          </For>
        </Show>
      </ol>
    </div>
  )
}
