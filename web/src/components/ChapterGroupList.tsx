import { For } from 'solid-js'
import { ChapterGroup } from './ChapterGroup'
import { useApi } from './ApiContext'
import { groupByBook, groupByDay } from '../utils/groupUtils'
import type { Tag } from '../data/model'
import styles from './ChapterGroupList.module.css'
import { useLocation } from '@solidjs/router'

const OT_NT = {
  OT: 3,
  NT: 2,
} as Record<Tag, number>

export function ChapterGroupList() {
  const api = useApi()
  const location = useLocation()

  const chapterGroupsRecord = () =>
    location.pathname.endsWith('/plan')
      ? groupByDay(chapters, api.getTags(), OT_NT)
      : groupByBook(chapters)

  const searchTextUc = () => api.searchText().toUpperCase()

  const chapters = api.getChapterData()
  const groupNames = Object.keys(chapterGroupsRecord())

  const filteredGroupNames = () =>
    searchTextUc() === ''
      ? groupNames
      : groupNames.filter(
          (groupName) =>
            chapterGroupsRecord()[groupName].filter((ch) =>
              ch.name.toUpperCase().includes(searchTextUc()),
            ).length > 0,
        )

  return (
    <div class={styles.ChapterGroupList}>
      <ul>
        <For each={filteredGroupNames()}>
          {(groupName) => {
            const chapters = chapterGroupsRecord()[groupName]
            return (
              <li>
                <ChapterGroup
                  data={{
                    name: groupName,
                    chapters,
                  }}
                  searchTextUc={searchTextUc()}
                />
              </li>
            )
          }}
        </For>
      </ul>
    </div>
  )
}
