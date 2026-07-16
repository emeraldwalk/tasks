import { createSignal, For, Show } from 'solid-js'
import type { PerDayTagData, Tag, TagDescriptions } from '../data/model'
import styles from './TagSelector.module.css'

export interface TagSelectorProps {
  tagNames: Tag[]
  tagDescriptions: TagDescriptions
  value: PerDayTagData
  onChange: (value: PerDayTagData) => void
}

export function TagSelector(props: TagSelectorProps) {
  const [searchText, setSearchText] = createSignal('')
  const [focused, setFocused] = createSignal(false)

  const tagNames = () => {
    const search = searchText().trim().toLowerCase()
    return props.tagNames
      .filter((tagName) => !props.value.tags.includes(tagName))
      .filter((tagName) => {
        if (!search) return true
        const description = props.tagDescriptions[tagName] ?? ''
        return (
          tagName.toLowerCase().includes(search) ||
          description.toLowerCase().includes(search)
        )
      })
  }

  const showPopup = () => focused() || !!searchText()

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
              <li class={styles.tagChip} title={props.tagDescriptions[tagName]}>
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
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onInput={(event) => {
                setSearchText(event.target.value)
              }}
            />
          </li>
        </ul>
        <Show when={showPopup()}>
          <ul class={styles.popup}>
            <For each={tagNames()} fallback={<li class={styles.popupEmpty}>No matching tags</li>}>
              {(tagName) => (
                <li onMouseDown={(e) => e.preventDefault()} onClick={onAdd(tagName)}>
                  <span class={styles.popupTagName}>{tagName}</span>
                  <Show when={props.tagDescriptions[tagName]}>
                    <span class={styles.popupTagDescription}>
                      {props.tagDescriptions[tagName]}
                    </span>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  )
}
