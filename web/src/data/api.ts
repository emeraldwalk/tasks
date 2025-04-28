import type {
  BibleBookMeta,
  BookID,
  ChapterID,
  ISODateTimeString,
  MMDD,
  TimeStampData,
} from './model'
import rawBibleBookMeta from './chapters.txt?raw'
import {
  addTimestamp,
  deleteTimeStamp,
  getTimeStampData,
  initDb,
} from './indexDb'
import { mmDD } from '../utils/dateUtils'

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

  getChapterDates = (
    bookId: BookID,
    chapterId: ChapterID,
  ): ISODateTimeString[] => {
    return Object.keys(
      this.getData()[bookId]?.[chapterId] ?? {},
    ) as ISODateTimeString[]
  }

  getData = (): TimeStampData => {
    return this._data
  }

  markAsRead = async (
    book: BookID,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    this._data[book] = this._data[book] || {}
    this._data[book][chapter] = this._data[book][chapter] || {}
    this._data[book][chapter][date] = true

    await addTimestamp(await this._db, book, chapter, date)
  }

  markAsUnread = async (
    book: BookID,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    if (this._data[book][chapter][date]) {
      delete this._data[book][chapter][date]
    }
    deleteTimeStamp(this._db, book, chapter, date)
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
