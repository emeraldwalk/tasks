import type {
  BookAbbrev,
  BookName,
  ChapterData,
  ChapterID,
  Tag,
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

export function getTagsData(): Record<Tag, BookAbbrev> {
  const lines = tagsData.split('\n')
  const tags: Record<Tag, BookAbbrev> = {}

  for (const line of lines) {
    const [tag, abbrev] = line.split(',') as [Tag, BookAbbrev]
    if (tag && abbrev) {
      tags[tag] = abbrev
    }
  }
  return tags
}
