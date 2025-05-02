import type { ChapterData, Tag, TagRecord } from '../data/model'
import { keys } from './dataUtils'
import { range } from './rangeUtils'

export function groupByBook(
  data: ChapterData[],
): Record<string, ChapterData[]> {
  return data.reduce((acc, chapter) => {
    const { name } = chapter
    acc[name] = acc[name] || []
    acc[name].push(chapter)
    return acc
  }, {} as Record<string, ChapterData[]>)
}

export function groupByDay(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  tagPerDay: Record<Tag, number>,
): Record<string, ChapterData[]> {
  const groups: Record<string, ChapterData[]> = {}

  console.log('[TESTING]', { chapters, tags: tagRecord, tagPerDay })

  const dayTags = keys(tagPerDay)

  let totalDays = 0
  const cursors: Record<Tag, number> = {}
  const tagChapters: Record<Tag, ChapterData[]> = {}

  for (const tag of dayTags) {
    cursors[tag] = 0
    tagChapters[tag] = chapters.filter((ch) => tagRecord[tag][ch.abbrev])

    // total days is the minimum number of buckets needed to fit the longest tag
    // chapter / tags per day count
    totalDays = Math.max(
      totalDays,
      Math.ceil(tagChapters[tag].length / tagPerDay[tag]),
    )
  }

  for (let i = 0; i < totalDays; i++) {
    const group: ChapterData[] = []

    for (const tag of dayTags) {
      for (let j = 0; j < tagPerDay[tag]; j++) {
        const c = cursors[tag] % tagChapters[tag].length
        // for last day, make sure we don't loop the longest tag
        if (i === totalDays - 1 && c < cursors[tag]) {
          break
        }
        cursors[tag] = c + 1
        group.push(tagChapters[tag][c])
      }
    }

    groups[`Day ${i + 1}`] = group
  }

  return groups
}
