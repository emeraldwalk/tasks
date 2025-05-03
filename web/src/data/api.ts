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
import { createSignal, type Accessor, type Setter } from 'solid-js'
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
    this._chapterData = chapterData
    this._settingsData = settingsData
    this._tagsData = tagsData

    // searchText signal
    const [searchText, setSearchText] = createSignal('')
    this.searchText = searchText
    this.setSearchText = setSearchText

    // showCompleted signal
    const [showCompleted, setShowCompleted] = createSignal(
      settingsData.showCompleted,
    )
    this.showCompleted = showCompleted
    this._setShowCompleted = setShowCompleted

    // Always signal when set so we can tell UI when properties change
    const [ts, setTs] = createSignal(timeStampData, { equals: false })
    this.timeStampData = ts
    this._setTimeStampData = setTs
  }

  private readonly _db: IDBDatabase
  private readonly _chapterData: ChapterData[]
  private readonly _settingsData: SettingsData
  private readonly _tagsData: TagRecord
  private readonly _setShowCompleted: Setter<boolean>
  private readonly _setTimeStampData: Setter<TimeStampData>

  readonly searchText: Accessor<string>
  readonly setSearchText: Setter<string>
  readonly showCompleted: Accessor<boolean>
  readonly timeStampData: Accessor<TimeStampData>

  getChapterData = (): ChapterData[] => {
    return this._chapterData
  }

  getChapterDates = ({
    abbrev,
    number,
  }: Pick<ChapterData, 'abbrev' | 'number'>): ISODateTimeString[] => {
    return Object.keys(
      this.timeStampData()[abbrev]?.[number] ?? {},
    ) as ISODateTimeString[]
  }

  getSettings = () => {
    return this._settingsData
  }

  getTags = (): TagRecord => {
    return this._tagsData
  }

  hasChapterDates = ({
    abbrev,
    number,
  }: Pick<ChapterData, 'abbrev' | 'number'>) => {
    return this.getChapterDates({ abbrev, number }).length > 0
  }

  completeCount = (chapters: ChapterData[]): number => {
    return chapters.filter(this.hasChapterDates).length
  }

  markAsRead = async (
    book: BookAbbrev,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    const timeStampData = this.timeStampData()
    timeStampData[book] = timeStampData[book] || {}
    timeStampData[book][chapter] = timeStampData[book][chapter] || {}
    timeStampData[book][chapter][date] = true

    this._setTimeStampData(timeStampData)

    await addTimestamp(await this._db, book, chapter, date)
  }

  markAsUnread = async (
    book: BookAbbrev,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    if (this.timeStampData()[book][chapter][date]) {
      delete this.timeStampData()[book][chapter][date]
      this._setTimeStampData(this.timeStampData())
    }
    deleteTimeStamp(this._db, book, chapter, date)
  }

  toggleShowCompleted = async () => {
    this._setShowCompleted((prev) => !prev)
    await updateSettings(this._db, this.showCompleted())
  }
}
