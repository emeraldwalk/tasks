import type {
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  TimeStampData,
  ChapterData,
  Tag,
  TagRecord,
} from './model'
import {
  addTimestamp,
  deleteTimeStamp,
  getTimeStampData,
  initDb,
} from './indexDb'
import { createSignal, type Accessor, type Setter } from 'solid-js'
import { getChapterData, getTagsData } from '../utils/dataUtils'

export class Api {
  static create = async (): Promise<Api> => {
    const db = await initDb()
    const data = await getTimeStampData(db)
    const chapterData = getChapterData()
    const tagsData = getTagsData()
    return new Api(db, data, chapterData, tagsData)
  }

  constructor(
    db: IDBDatabase,
    timeStampData: TimeStampData,
    chapterData: ChapterData[],
    tagsData: TagRecord,
  ) {
    this._db = db
    this._timeStampData = timeStampData
    this._chapterData = chapterData
    this._tagsData = tagsData

    const [showCompleted, setShowCompleted] = createSignal(true)
    this.showCompleted = showCompleted
    this.setShowCompleted = setShowCompleted
  }

  private readonly _db: IDBDatabase
  private readonly _chapterData: ChapterData[]
  private readonly _tagsData: TagRecord
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

  getTags = (): TagRecord => {
    return this._tagsData
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
