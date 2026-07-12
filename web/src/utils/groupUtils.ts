import type {
  BookName,
  ChapterData,
  PerDayTagData,
  Tag,
  TagRecord,
} from '../data/model'

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

function buildTagPool(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  tag: Tag,
): ChapterData[] {
  return chapters.filter((ch) => tagRecord[tag]?.[ch.abbrev])
}

export function groupByDay(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  perDayTagData: PerDayTagData[],
  targetDays: number,
): Record<string, ChapterData[]> {
  const groups: Record<string, ChapterData[]> = {}

  const pools: ChapterData[][] = perDayTagData.map((entry) =>
    entry.tags.flatMap((tag) => buildTagPool(chapters, tagRecord, tag))
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

export interface TagStat {
  tag: Tag
  poolSize: number
  timesThrough: number
}

export interface GroupStat {
  poolSize: number
  timesThrough: number
  tagStats: TagStat[]
}

/**
 * Projects how many times each tag in a plan-settings group would be read
 * through over `targetDays`, given the group reads sequentially through its
 * tags' combined pool (all of tag A, then all of tag B, ...) and wraps.
 */
export function computeGroupStat(
  chapters: ChapterData[],
  tagRecord: TagRecord,
  entry: PerDayTagData,
  targetDays: number,
): GroupStat {
  const tagPools = entry.tags.map((tag) => ({
    tag,
    pool: buildTagPool(chapters, tagRecord, tag),
  }))
  const poolSize = tagPools.reduce((sum, { pool }) => sum + pool.length, 0)
  const totalConsumed = entry.count * targetDays
  const fullCycles = poolSize > 0 ? Math.floor(totalConsumed / poolSize) : 0
  const remainder = poolSize > 0 ? totalConsumed % poolSize : 0

  let offset = 0
  const tagStats: TagStat[] = tagPools.map(({ tag, pool }) => {
    const size = pool.length
    const covered =
      size > 0
        ? fullCycles * size + Math.max(0, Math.min(remainder - offset, size))
        : 0
    offset += size
    return { tag, poolSize: size, timesThrough: size > 0 ? covered / size : 0 }
  })

  return {
    poolSize,
    timesThrough: poolSize > 0 ? totalConsumed / poolSize : 0,
    tagStats,
  }
}
