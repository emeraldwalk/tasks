import { For } from 'solid-js'
import { ChapterGroup } from './ChapterGroup'
import { useApi } from './ApiContext'
import type { ChapterData } from '../data/model'
import styles from './ChapterGroupList.module.css'

export interface ChapterGroupListProps {
  sortProgressToTop?: boolean
  data: Record<string, ChapterData[]>
}

export function ChapterGroupList(props: ChapterGroupListProps) {
  const api = useApi()

  const searchTextUc = () => api.searchText().toUpperCase()
  const groupNames = () => Object.keys(props.data)

  const filteredGroupNames = () =>
    searchTextUc() === ''
      ? groupNames()
      : groupNames().filter(
          (groupName) =>
            props.data[groupName].filter((ch) =>
              ch.name.toUpperCase().includes(searchTextUc()),
            ).length > 0,
        )

  const sortedGroupNames = () =>
    props.sortProgressToTop
      ? filteredGroupNames().toSorted((a, b) => {
          const aCount = api.completeCount(props.data[a]) > 0
          const bCount = api.completeCount(props.data[b]) > 0
          return Number(bCount) - Number(aCount)
        })
      : filteredGroupNames()

  return (
    <div class={styles.ChapterGroupList}>
      <ul>
        <For each={sortedGroupNames()}>
          {(groupName) => {
            const chapters = props.data[groupName]
            return (
              <li class={styles.group}>
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
  )
}
