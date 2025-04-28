import { createEffect, createSignal, For, Show } from 'solid-js'
import styles from './Chapter.module.css'
import { className } from '../utils/cssUtils'
import accordionStyles from './Accordion.module.css'
import { mmDD, now } from '../utils/dateUtils'
import type { BookID, ChapterID } from '../data/model'
import { useApi } from './ApiContext'

export interface ChapterProps {
  bookName: string
  abbrev: BookID
  number: ChapterID
  initialValue: number
}

export function Chapter(props: ChapterProps) {
  const api = useApi()
  const [isExpanded, setIsExpanded] = createSignal(false)

  const [dates, setDates] = createSignal(
    api.getChapterDates(props.abbrev, props.number),
  )

  async function onAdd() {
    const date = now()
    setDates((prev) => [...prev, date])
    await api.markAsRead(props.abbrev, props.number, date)
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
      <ion-icon
        name={dates().length ? 'checkmark-circle' : 'ellipse-outline'}
        size="large"
        onClick={onAdd}></ion-icon>
      <span class={styles.header} onClick={onExpanderClick}>
        <span class={styles.label}>
          {props.bookName} {props.number}
        </span>
        <span class={styles.count}>({dates().length})</span>
        <ion-icon name="chevron-down-sharp"></ion-icon>
      </span>
      <div class={className(styles.dateList, accordionStyles.content)}>
        <Show when={isExpanded()}>
          <For each={dates()}>
            {(date) => (
              <button
                class={styles.date}
                onClick={() => {
                  setDates((prev) => prev.filter((d) => d !== date))
                  api.markAsUnread(props.abbrev, props.number, date)
                }}>
                {mmDD(date)}
              </button>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}
