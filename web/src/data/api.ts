import type {
  BookData,
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  MMDD,
  TimeStampData,
  BookName,
  ChapterData,
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

  constructor(db: IDBDatabase, timeStampData: TimeStampData) {
    this._db = db
    this._timeStampData = timeStampData
    this._chapterData = getChapterData()
  }

  private readonly _db: IDBDatabase
  private readonly _chapterData: ChapterData[]
  private readonly _timeStampData: TimeStampData

  getChapterData = (): ChapterData[] => {
    return this._chapterData
  }

  getChapterDates = (
    bookId: BookAbbrev,
    chapterId: ChapterID,
  ): ISODateTimeString[] => {
    return Object.keys(
      this.getTimeStampData()[bookId]?.[chapterId] ?? {},
    ) as ISODateTimeString[]
  }

  getTimeStampData = (): TimeStampData => {
    return this._timeStampData
  }

  markAsRead = async (
    book: BookAbbrev,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    this._timeStampData[book] = this._timeStampData[book] || {}
    this._timeStampData[book][chapter] =
      this._timeStampData[book][chapter] || {}
    this._timeStampData[book][chapter][date] = true

    await addTimestamp(await this._db, book, chapter, date)
  }

  markAsUnread = async (
    book: BookAbbrev,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    if (this._timeStampData[book][chapter][date]) {
      delete this._timeStampData[book][chapter][date]
    }
    deleteTimeStamp(this._db, book, chapter, date)
  }
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
