import type {
  BibleBookMeta,
  BookID,
  ChapterID,
  ISODateTimeString,
  TimeStampData,
} from './model'
import rawBibleBookMeta from './chapters.txt?raw'
import { addTimestamp, getTimeStampData, initDb } from './indexDb'

export class Api {
  static create = async (): Promise<Api> => {
    const db = await initDb()
    const data = await getTimeStampData(db)
    return new Api(db, data)
  }

  constructor(db: IDBDatabase, data: TimeStampData) {
    this._db = db
    this._data = data
  }

  private readonly _db: IDBDatabase
  private readonly _data: TimeStampData

  getData = (): TimeStampData => {
    return this._data
  }

  markChapterAsRead = async (
    book: BookID,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    const data = await this._data

    data[book] = data[book] || {}
    data[book][chapter] = data[book][chapter] || {}
    data[book][chapter][date] = true

    await addTimestamp(await this._db, book, chapter, date)
  }
}

export function getBibleBookMeta(): BibleBookMeta[] {
  const lines = rawBibleBookMeta.split('\n')
  const books: BibleBookMeta[] = []
  for (const line of lines) {
    const [abbrev, name, chapterCount] = line.split(',') as [
      BookID,
      string,
      string,
    ]
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
