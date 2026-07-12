import { createEffect, createSignal, For, Show } from 'solid-js'
import type { ChapterData, ChapterGroupData } from '../data/model'
import styles from './ChapterGroup.module.css'
import accordionStyles from './Accordion.module.css'
import { className } from '../utils/cssUtils'
import { Chapter } from './Chapter'
import { useApi } from './ApiContext'
import { CheckMark } from './CheckMark'
import { Icon } from './Icon'

export interface ChapterGroupProps {
  data: ChapterGroupData
  searchTextUc: string
}

export function ChapterGroup(props: ChapterGroupProps) {
  const api = useApi()
  const [isExpanded, setIsExpanded] = createSignal(false)
  const completedCount = () => api.completeCount(props.data.chapters)
  const completionStatus = () => {
    const count = completedCount()

    if (count === props.data.chapters.length) {
      return 'complete'
    }

    if (count > 0) {
      return 'partial'
    }

    return 'incomplete'
  }

  function searchTextFilter({ name }: ChapterData) {
    return name.toUpperCase().includes(props.searchTextUc)
  }

  const filteredChapters = () =>
    api.showCompleted()
      ? props.data.chapters.filter(searchTextFilter)
      : props.data.chapters.filter(
          (chapter) =>
            !api.hasChapterDates(chapter) && searchTextFilter(chapter),
        )

  const [chapters, setChapters] = createSignal(filteredChapters())

  createEffect(() => {
    setChapters(filteredChapters())
  })

  function onChapterChange() {
    setChapters(filteredChapters())
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
        <CheckMark state={completionStatus()} />
        <span class={styles.label}>
          <Show when={completedCount() > 0}>
            <span class={styles.completedCount}>({completedCount()})</span>
          </Show>
          {props.data.name}
        </span>
        {chapters().length}
        <Icon class={accordionStyles.icon} name="chevron-down-sharp" />
      </span>

      <ol class={className(styles.chapterList, accordionStyles.content)}>
        <Show when={isExpanded()}>
          <For each={chapters()}>
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
