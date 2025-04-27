import { createSignal, For } from 'solid-js'
import { getBibleBookMeta } from '../data/api'
import { range } from '../utils/rangeUtils'
import { Chapter } from './Chapter'
import styles from './BookList.module.css'
import { SearchInput } from './SearchInput'

export function BookList() {
  const [searchText, setSearchText] = createSignal('')
  const bookMetaList = getBibleBookMeta()

  const searchTextLc = () => searchText().toLowerCase()

  const filteredBookList = () =>
    searchText() === ''
      ? bookMetaList
      : bookMetaList.filter((book) =>
          book.name.toLowerCase().includes(searchTextLc()),
        )

  function onChange(value: number) {
    console.log(value)
  }

  return (
    <div class={styles.BookList}>
      <SearchInput class={styles.search} onSearch={setSearchText} />
      <div class={styles.scroll}>
        <ul>
          <For each={filteredBookList()}>
            {(book) => (
              <li>
                {book.name}
                <ol>
                  <For each={[...range(1, book.chapterCount)]}>
                    {(i) => (
                      <li>
                        <Chapter
                          bookName={book.name}
                          number={i}
                          initialValue={0}
                          onChange={onChange}
                        />
                      </li>
                    )}
                  </For>
                </ol>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  )
}
