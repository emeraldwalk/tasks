import type {
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  TimeStampData,
  ChapterData,
  TagRecord,
  SettingsData,
} from './model'
import {
  addTimestamp,
  deleteTimeStamp,
  getSettingsData,
  getTimeStampData,
  initDb,
  updateSettings,
} from './indexDb'
import {
  createEffect,
  createSignal,
  type Accessor,
  type Setter,
} from 'solid-js'
import { getChapterData, getTagsData } from '../utils/dataUtils'

export class Api {
  static create = async (): Promise<Api> => {
    const db = await initDb()
    const data = await getTimeStampData(db)
    const chapterData = getChapterData()
    const settingsData = await getSettingsData(db)
    const tagsData = getTagsData()
    return new Api(db, data, chapterData, settingsData, tagsData)
  }

  constructor(
    db: IDBDatabase,
    timeStampData: TimeStampData,
    chapterData: ChapterData[],
    settingsData: SettingsData,
    tagsData: TagRecord,
  ) {
    this._db = db
    this._timeStampData = timeStampData
    this._chapterData = chapterData
    this._settingsData = settingsData
    this._tagsData = tagsData

    const [showCompleted, setShowCompleted] = createSignal(true)
    this.showCompleted = showCompleted
    this._setShowCompleted = setShowCompleted
  }

  private readonly _db: IDBDatabase
  private readonly _chapterData: ChapterData[]
  private readonly _settingsData: SettingsData
  private readonly _tagsData: TagRecord
  private readonly _timeStampData: TimeStampData
  private readonly _setShowCompleted: Setter<boolean>

  readonly showCompleted: Accessor<boolean>

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

  getSettings = () => {
    return this._settingsData
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

  toggleShowCompleted = async () => {
    this._setShowCompleted((prev) => !prev)
    await updateSettings(this._db, this.showCompleted())
  }
}
