import { createSignal, For } from 'solid-js'
import { SearchInput } from './SearchInput'
import { ChapterGroup } from './ChapterGroup'
import { useApi } from './ApiContext'
import { groupByBook, groupByDay } from '../utils/groupUtils'
import styles from './ChapterGroupList.module.css'
import type { Tag } from '../data/model'

const OT_NT = {
  OT: 3,
  NT: 2,
} as Record<Tag, number>

export function ChapterGroupList() {
  const api = useApi()

  const [searchText, setSearchText] = createSignal('')
  const searchTextUc = () => searchText().toUpperCase()

  const chapters = api.getChapterData()
  const chapterGroupsRecord = groupByBook(chapters)
  // const chapterGroupsRecord = groupByDay(chapters, api.getTags(), OT_NT)
  const groupNames = Object.keys(chapterGroupsRecord)

  const filteredGroupNames = () =>
    searchText() === ''
      ? groupNames
      : groupNames.filter(
          (groupName) =>
            chapterGroupsRecord[groupName].filter((ch) =>
              ch.name.toUpperCase().includes(searchTextUc()),
            ).length > 0,
        )

  return (
    <div class={styles.ChapterGroupList}>
      <SearchInput class={styles.search} onSearch={setSearchText} />
      <label class={styles.showCompleted}>
        <input
          type="checkbox"
          checked={api.showCompleted()}
          onChange={() => api.toggleShowCompleted()}
        />
        Show Completed
      </label>
      <div class={styles.scroll}>
        <ul>
          <For each={filteredGroupNames()}>
            {(groupName) => {
              const chapters = chapterGroupsRecord[groupName]
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
    </div>
  )
}
