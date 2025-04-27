import type { BibleBookMeta } from './model'
import rawBibleBookMeta from './chapters.txt?raw'

export function getBibleBookMeta(): BibleBookMeta[] {
  const lines = rawBibleBookMeta.split('\n')
  const books: BibleBookMeta[] = []
  for (const line of lines) {
    const [abbrev, name, chapterCount] = line.split(',')
    if (name && abbrev && chapterCount) {
      books.push({
        name,
        abbrev,
        chapterCount: parseInt(chapterCount),
      })
    }
  }
  return books
}
