import { createSignal, For } from 'solid-js'
import { getBibleBookMeta } from '../data/api'
import styles from './BookList.module.css'
import { SearchInput } from './SearchInput'
import { Book } from './Book'

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
                <Book
                  name={book.name}
                  abbrev={book.abbrev}
                  chapterCount={book.chapterCount}
                  onChange={onChange}
                />
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  )
}
