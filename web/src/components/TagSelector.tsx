import { createSignal, For, Show } from 'solid-js'
import type { PerDayTagData, Tag } from '../data/model'
import styles from './TagSelector.module.css'

export interface TagSelectorProps {
  tagNames: Tag[]
  value: PerDayTagData
  onChange: (value: PerDayTagData) => void
}

export function TagSelector(props: TagSelectorProps) {
  const [searchText, setSearchText] = createSignal('')

  const tagNames = () =>
    props.tagNames.filter((tagName) => !props.value.tags.includes(tagName))

  const onAdd = (tagName: Tag) => {
    return () => {
      setSearchText('')
      props.onChange({
        ...props.value,
        tags: [...props.value.tags, tagName],
      })
    }
  }

  return (
    <div class={styles.TagSelector}>
      <input type="number" />
      <div>
        <ul class={styles.tagList}>
          <For each={props.value.tags}>{(tagName) => <li>{tagName}</li>}</For>
          <li>
            <input
              class={styles.addTag}
              onInput={(event) => {
                setSearchText(event.target.value)
              }}
            />
          </li>
        </ul>
        <Show when={searchText()}>
          <ul class={styles.popup}>
            <For each={tagNames()}>
              {(tagName) => <li onClick={onAdd(tagName)}>{tagName}</li>}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  )
}
