import { createSignal, For } from 'solid-js'
import styles from './BookList.module.css'
import { SearchInput } from './SearchInput'
import { ChapterGroup } from './ChapterGroup'
import { useApi } from './ApiContext'
import { groupByBook } from '../utils/groupUtils'

export function BookList() {
  const api = useApi()

  const [searchText, setSearchText] = createSignal('')
  const searchTextUc = () => searchText().toUpperCase()

  const chapters = api.getChapterData()
  const bookGroups = groupByBook(chapters)
  const bookNames = Object.keys(bookGroups)

  const filteredBookNames = () =>
    searchText() === ''
      ? bookNames
      : bookNames.filter((bookName) =>
          bookName.toUpperCase().includes(searchTextUc()),
        )

  return (
    <div class={styles.BookList}>
      <SearchInput class={styles.search} onSearch={setSearchText} />
      <div class={styles.scroll}>
        <ul>
          <For each={filteredBookNames()}>
            {(bookName) => {
              const chapters = bookGroups[bookName]
              return (
                <li>
                  <ChapterGroup
                    data={{
                      name: bookName,
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
