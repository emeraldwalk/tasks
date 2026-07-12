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

  const onRemove = (tagName: Tag) => {
    return () => {
      props.onChange({
        ...props.value,
        tags: props.value.tags.filter((t) => t !== tagName),
      })
    }
  }

  return (
    <div class={styles.TagSelector}>
      <div class={styles.countField}>
        <input
          type="number"
          value={props.value.count}
          min={1}
          onInput={(e) => props.onChange({ ...props.value, count: +e.target.value })}
        />
        <span class={styles.countLabel}>chapters/day</span>
      </div>
      <div class={styles.tagArea}>
        <ul class={styles.tagList}>
          <For each={props.value.tags}>
            {(tagName) => (
              <li class={styles.tagChip}>
                {tagName}
                <button type="button" onClick={onRemove(tagName)}>×</button>
              </li>
            )}
          </For>
          <li class={styles.addTagItem}>
            <input
              class={styles.addTag}
              placeholder="Add tag…"
              value={searchText()}
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
