import { createSignal, For, Show } from 'solid-js'
import type { PerDayTagData, Tag, TagDescriptions } from '../data/model'
import styles from './TagSelector.module.css'

export interface TagSelectorProps {
  tagNames: Tag[]
  /** Single-book pseudo-tags (e.g. "Genesis"), listed after tagNames in their own section. */
  bookTagNames: Tag[]
  tagDescriptions: TagDescriptions
  value: PerDayTagData
  onChange: (value: PerDayTagData) => void
}

export function TagSelector(props: TagSelectorProps) {
  const [searchText, setSearchText] = createSignal('')
  const [focused, setFocused] = createSignal(false)

  const filterCandidates = (candidates: Tag[]) => {
    const search = searchText().trim().toLowerCase()
    return candidates
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

  const filteredTagNames = () => filterCandidates(props.tagNames)
  const filteredBookTagNames = () => filterCandidates(props.bookTagNames)

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

  const renderOption = (tagName: Tag) => (
    <li onMouseDown={(e) => e.preventDefault()} onClick={onAdd(tagName)}>
      <span class={styles.popupTagName}>{tagName}</span>
      <Show when={props.tagDescriptions[tagName]}>
        <span class={styles.popupTagDescription}>{props.tagDescriptions[tagName]}</span>
      </Show>
    </li>
  )

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
            <Show when={filteredTagNames().length}>
              <li class={styles.popupSectionLabel}>Tags</li>
              <For each={filteredTagNames()}>{renderOption}</For>
            </Show>
            <Show when={filteredBookTagNames().length}>
              <li class={styles.popupSectionLabel}>Books</li>
              <For each={filteredBookTagNames()}>{renderOption}</For>
            </Show>
            <Show when={!filteredTagNames().length && !filteredBookTagNames().length}>
              <li class={styles.popupEmpty}>No matching tags</li>
            </Show>
          </ul>
        </Show>
      </div>
    </div>
  )
}
