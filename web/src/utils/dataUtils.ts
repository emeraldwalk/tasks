import type {
  BookAbbrev,
  BookName,
  ChapterData,
  ChapterID,
  Tag,
  TagRecord,
} from '../data/model'
import rawBibleBookMeta from '../data/chapters.txt?raw'
import tagsData from '../data/tags.txt?raw'

export function getChapterData(): ChapterData[] {
  const lines = rawBibleBookMeta.split('\n')
  const chapters: ChapterData[] = []

  for (const line of lines) {
    const [abbrev, name, chapterCount] = line.split(',') as [
      BookAbbrev,
      BookName,
      string,
    ]

    if (name && abbrev && chapterCount) {
      for (let i = 1; i <= parseInt(chapterCount); i++) {
        chapters.push({
          name,
          abbrev,
          number: i as ChapterID,
        })
      }
    }
  }
  return chapters
}

export function getTagsData(): TagRecord {
  const lines = tagsData.split('\n')
  const tags: TagRecord = {}

  for (const line of lines) {
    const [tag, abbrev] = line.split(',') as [Tag, BookAbbrev]
    if (tag && abbrev) {
      tags[tag] = tags[tag] || {}
      tags[tag][abbrev] = true
    }
  }
  return tags
}

export function keys<TKey extends string | number | symbol>(
  obj: Record<TKey, unknown>,
) {
  return Object.keys(obj) as TKey[]
}
