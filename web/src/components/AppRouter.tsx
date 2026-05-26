import { Route, Router } from '@solidjs/router'
import { Layout } from './Layout'
import { ChapterGroupList } from './ChapterGroupList'
import { HistoryList } from './HistoryList'
import { getBookNamesMap, getChapterData } from '../utils/dataUtils'
import { groupByBook, groupByDay } from '../utils/groupUtils'
import { useApi } from './ApiContext'
import { createMemo } from 'solid-js'
import type { Tag } from '../data/model'

const OT_NT = {
  OT: 3,
  NT: 2,
} as Record<Tag, number>

export function AppRouter() {
  const api = useApi()

  const chapters = getChapterData()
  const bookNames = getBookNamesMap(chapters)
  const bookGroups = groupByBook(chapters)
  const planGroups = createMemo(() =>
    groupByDay(chapters, api.getTags(), OT_NT),
  )

  return (
    <Router base={import.meta.env.BASE_URL} root={Layout}>
      <Route
        path="/"
        component={() => (
          <ChapterGroupList data={bookGroups} sortProgressToTop />
        )}
      />
      <Route
        path="/plan"
        component={() => <ChapterGroupList data={planGroups()} />}
      />

      <Route
        path="/history"
        component={() => <HistoryList data={bookNames} />}
      />
    </Router>
  )
}
