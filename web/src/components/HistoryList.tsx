import { createEffect, For } from 'solid-js'
import styles from './HistoryList.module.css'
import { useApi } from './ApiContext'
import { localDateTimeString, mmDDYYYY } from '../utils/dateUtils'
import type { BookAbbrev, BookName } from '../data/model'

export interface HistoryListProps {
  data: Record<BookAbbrev, BookName>
}

export function HistoryList(props: HistoryListProps) {
  const api = useApi()
  const searchTextUc = () => api.searchText().toUpperCase()
  const bookNames = () => props.data
  const timeStampData = () => api.getTimeStampData()

  const filteredTimeStampData = () => {
    const filtered =
      searchTextUc() === ''
        ? timeStampData()
        : timeStampData().filter((ts) =>
            `${ts.book} ${ts.chapter}`.toUpperCase().includes(searchTextUc()),
          )

    return filtered.toSorted((a, b) => b.date.localeCompare(a.date))
  }

  return (
    <div class={styles.HistoryList}>
      <ul>
        <For each={filteredTimeStampData()}>
          {(ts) => {
            return (
              <li class={styles.group}>
                <span>
                  {bookNames()[ts.book]} {ts.chapter}
                </span>
                <span class={styles.timeStamp}>
                  {localDateTimeString(ts.date)}
                </span>
              </li>
            )
          }}
        </For>
      </ul>
    </div>
  )
}
