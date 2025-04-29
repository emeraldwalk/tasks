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
import { createSignal, type Accessor, type Setter } from 'solid-js'

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

    const [showCompleted, setShowCompleted] = createSignal(true)
    this.showCompleted = showCompleted
    this.setShowCompleted = setShowCompleted
  }

  private readonly _db: IDBDatabase
  private readonly _chapterData: ChapterData[]
  private readonly _timeStampData: TimeStampData

  readonly showCompleted: Accessor<boolean>
  readonly setShowCompleted: Setter<boolean>

  getChapterData = (): ChapterData[] => {
    return this._chapterData
  }

  getChapterDates = ({
    abbrev,
    number,
  }: Pick<ChapterData, 'abbrev' | 'number'>): ISODateTimeString[] => {
    return Object.keys(
      this.getTimeStampData()[abbrev]?.[number] ?? {},
    ) as ISODateTimeString[]
  }

  getTimeStampData = (): TimeStampData => {
    return this._timeStampData
  }

  hasChapterDates = ({
    abbrev,
    number,
  }: Pick<ChapterData, 'abbrev' | 'number'>) => {
    return this.getChapterDates({ abbrev, number }).length > 0
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
