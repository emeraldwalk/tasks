import { createSignal, For } from 'solid-js'
import { SearchInput } from './SearchInput'
import { ChapterGroup } from './ChapterGroup'
import { useApi } from './ApiContext'
import { groupByBook } from '../utils/groupUtils'
import styles from './ChapterGroupList.module.css'

export function ChapterGroupList() {
  const api = useApi()

  const [searchText, setSearchText] = createSignal('')
  const searchTextUc = () => searchText().toUpperCase()

  const chapters = api.getChapterData()
  const chapterGroupsRecord = groupByBook(chapters)
  const groupNames = Object.keys(chapterGroupsRecord)

  const filteredGroupNames = () =>
    searchText() === ''
      ? groupNames
      : groupNames.filter((bookName) =>
          bookName.toUpperCase().includes(searchTextUc()),
        )

  return (
    <div class={styles.ChapterGroupList}>
      <SearchInput class={styles.search} onSearch={setSearchText} />
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
