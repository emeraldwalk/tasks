import { createEffect, createSignal, For, Show } from 'solid-js'
import styles from './Chapter.module.css'
import { className } from '../utils/cssUtils'
import accordionStyles from './Accordion.module.css'
import { mmDD, now } from '../utils/dateUtils'
import type { ChapterData, ISODateTimeString } from '../data/model'
import { useApi } from './ApiContext'
import { CheckMark } from './CheckMark'
import { Icon } from './Icon'

export interface ChapterProps {
  data: ChapterData
  onChange: () => void
}

export function Chapter(props: ChapterProps) {
  const api = useApi()
  const [isExpanded, setIsExpanded] = createSignal(false)

  const [dates, setDates] = createSignal(api.getChapterDates(props.data))

  async function onAdd() {
    const date = now()
    setDates((prev) => [...prev, date])
    await api.markAsRead(props.data.abbrev, props.data.number, date)
    props.onChange()
  }

  function onRemove(date: ISODateTimeString) {
    return async () => {
      setDates((prev) => prev.filter((d) => d !== date))
      await api.markAsUnread(props.data.abbrev, props.data.number, date)
      props.onChange()
    }
  }

  function onExpanderClick() {
    if (dates().length === 0) {
      return
    }
    setIsExpanded((prev) => !prev)
  }

  createEffect(() => {
    if (dates().length === 0) {
      setIsExpanded(false)
    }
  })

  return (
    <div
      class={className(
        styles.Chapter,
        isExpanded() && styles.isExpanded,
        isExpanded() && accordionStyles.isExpanded,
        dates().length > 0 && styles.hasDates,
      )}>
      <span class={styles.header}>
        <CheckMark
          state={dates().length ? 'complete' : 'incomplete'}
          onClick={onAdd}
        />
        <span class={styles.label} onClick={onExpanderClick}>
          {props.data.name} {props.data.number}
        </span>
      </span>
      <span class={styles.expander} onClick={onExpanderClick}>
        <span class={styles.count}>({dates().length})</span>
        <Icon class={styles.icon} name="chevron-down-sharp" />
      </span>
      <div class={className(styles.dateList, accordionStyles.content)}>
        <Show when={isExpanded()}>
          <For each={dates()}>
            {(date) => (
              <button class={styles.date} onClick={onRemove(date)}>
                {mmDD(date)}
              </button>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}
