import type { BookName, ChapterData, PerDayTagData, TagRecord } from '../data/model'

export function groupByBook(
  data: ChapterData[],
): Record<BookName, ChapterData[]> {
  return data.reduce((acc, chapter) => {
    const { name } = chapter
    acc[name] = acc[name] || []
    acc[name].push(chapter)
    return acc
  }, {} as Record<BookName, ChapterData[]>)
}

export function groupByDay(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  perDayTagData: PerDayTagData[],
  targetDays: number,
): Record<string, ChapterData[]> {
  const groups: Record<string, ChapterData[]> = {}

  const pools: ChapterData[][] = perDayTagData.map((entry) =>
    entry.tags.flatMap((tag) => chapters.filter((ch) => tagRecord[tag]?.[ch.abbrev]))
  )
  const cursors: number[] = pools.map(() => 0)

  for (let day = 0; day < targetDays; day++) {
    const group: ChapterData[] = []
    for (let i = 0; i < perDayTagData.length; i++) {
      const pool = pools[i]
      if (!pool.length) continue
      for (let j = 0; j < perDayTagData[i].count; j++) {
        group.push(pool[cursors[i] % pool.length])
        cursors[i]++
      }
    }
    groups[`Day ${day + 1}`] = group
  }

  return groups
}
