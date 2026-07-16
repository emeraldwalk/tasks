import type {
  BookAbbrev,
  BookName,
  ChapterData,
  ChapterID,
  Tag,
  TagDescriptions,
  TagRecord,
} from '../data/model'
import rawBibleBookMeta from '../data/chapters.txt?raw'
import tagsData from '../data/tags.txt?raw'
import tagDescriptionsData from '../data/tagDescriptions.txt?raw'

export function getBookNamesMap(
  chapters: ChapterData[],
): Record<BookAbbrev, BookName> {
  const bookNamesMap: Record<BookAbbrev, BookName> = {}
  for (const chapter of chapters) {
    bookNamesMap[chapter.abbrev] = chapter.name
  }
  return bookNamesMap
}

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

export function getTagDescriptions(): TagDescriptions {
  const lines = tagDescriptionsData.split('\n')
  const descriptions: TagDescriptions = {}

  for (const line of lines) {
    const commaIndex = line.indexOf(',')
    if (commaIndex === -1) continue

    const tag = line.slice(0, commaIndex) as Tag
    const description = line.slice(commaIndex + 1).trim()
    if (tag && description) {
      descriptions[tag] = description
    }
  }
  return descriptions
}

/** One pseudo-tag per Bible book (keyed by its full name, e.g. "Genesis"), covering just that book. Lets a single book be picked the same way a tag group is. */
export function getBookTagsData(chapters: ChapterData[]): TagRecord {
  const bookNames = getBookNamesMap(chapters)
  const tags: TagRecord = {}

  for (const abbrev of keys(bookNames)) {
    const tag = bookNames[abbrev] as unknown as Tag
    tags[tag] = { [abbrev]: true }
  }
  return tags
}

export function getBookTagDescriptions(chapters: ChapterData[]): TagDescriptions {
  const bookNames = getBookNamesMap(chapters)
  const chapterCounts: Partial<Record<BookAbbrev, number>> = {}
  for (const { abbrev } of chapters) {
    chapterCounts[abbrev] = (chapterCounts[abbrev] ?? 0) + 1
  }

  const descriptions: TagDescriptions = {}
  for (const abbrev of keys(bookNames)) {
    const tag = bookNames[abbrev] as unknown as Tag
    const count = chapterCounts[abbrev] ?? 0
    descriptions[tag] = `${count} chapter${count === 1 ? '' : 's'}`
  }
  return descriptions
}

export function keys<TKey extends string>(obj: Record<TKey, unknown>) {
  return Object.keys(obj) as TKey[]
}
