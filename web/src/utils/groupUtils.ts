import type { ChapterData } from '../data/model'

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
