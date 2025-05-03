import { className } from '../utils/cssUtils'
import styles from './SearchInput.module.css'

export interface SearchInputProps {
  class?: string
  onSearch: (query: string) => void
}

export function SearchInput({ class: class_, onSearch }: SearchInputProps) {
  let timeout: number
  function onInput(
    event: InputEvent & {
      currentTarget: HTMLInputElement
      target: HTMLInputElement
    },
  ) {
    const value = event.target.value
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      onSearch(value)
    }, 600)
  }

  return (
    <input
      class={className(styles.SearchInput)}
      type="search"
      placeholder="Search..."
      onInput={onInput}
    />
  )
}
