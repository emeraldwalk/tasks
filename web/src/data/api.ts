import type {
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  TimeStampMap,
  ChapterData,
  TagRecord,
  SettingsData,
  PerDayTagData,
  Tag,
  TimeStampData,
} from './model'
import {
  addTimestamp,
  deleteTimeStamp,
  getSettingsData,
  getTimeStampMap,
  initDb,
  updateSettings,
} from './indexDb'
import { createSignal, type Accessor, type Setter } from 'solid-js'
import { getChapterData, getTagsData, keys } from '../utils/dataUtils'

export class Api {
  static create = async (): Promise<Api> => {
    const db = await initDb()
    const timeStampMap = await getTimeStampMap(db)
    const chapterData = getChapterData()
    const settingsData = await getSettingsData(db)
    const tagsData = getTagsData()
    return new Api(db, timeStampMap, chapterData, settingsData, tagsData)
  }

  constructor(
    db: IDBDatabase,
    timeStampMap: TimeStampMap,
    chapterData: ChapterData[],
    settingsData: SettingsData,
    tagsData: TagRecord,
  ) {
    this._db = db
    this._chapterData = chapterData
    this._settingsData = settingsData
    this._tagsData = tagsData

    // perDayTagData signal
    const [perDayTagData, setPerDayTagData] = createSignal<PerDayTagData[]>([
      {
        tags: ['OT' as Tag],
        count: 3,
      },
      {
        tags: ['NT' as Tag],
        count: 2,
      },
    ])
    this.perDayTagData = perDayTagData
    this.setPerDayTagData = setPerDayTagData

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
    const [ts, setTs] = createSignal(timeStampMap, { equals: false })
    this.timeStampMap = ts
    this._setTimeStampMap = setTs
  }

  private readonly _db: IDBDatabase
  private readonly _chapterData: ChapterData[]
  private readonly _settingsData: SettingsData
  private readonly _tagsData: TagRecord
  private readonly _setShowCompleted: Setter<boolean>
  private readonly _setTimeStampMap: Setter<TimeStampMap>

  readonly perDayTagData: Accessor<PerDayTagData[]>
  readonly setPerDayTagData: Setter<PerDayTagData[]>
  readonly searchText: Accessor<string>
  readonly setSearchText: Setter<string>
  readonly showCompleted: Accessor<boolean>
  readonly timeStampMap: Accessor<TimeStampMap>

  getChapterData = (): ChapterData[] => {
    return this._chapterData
  }

  getChapterDates = ({
    abbrev,
    number,
  }: Pick<ChapterData, 'abbrev' | 'number'>): ISODateTimeString[] => {
    return Object.keys(
      this.timeStampMap()[abbrev]?.[number] ?? {},
    ) as ISODateTimeString[]
  }

  getTimeStampData = (): TimeStampData[] => {
    const timeStampMap = this.timeStampMap()

    const timeStampData: TimeStampData[] = []

    for (const book of keys(timeStampMap)) {
      const chapters = timeStampMap[book]

      for (const chapterId of keys(chapters)) {
        const chapter = +chapterId as ChapterID
        const dates = chapters[chapter]

        for (const date of keys(dates)) {
          timeStampData.push({
            date,
            book,
            chapter,
          })
        }
      }
    }

    return timeStampData
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
    const timeStampMap = this.timeStampMap()
    timeStampMap[book] = timeStampMap[book] || {}
    timeStampMap[book][chapter] = timeStampMap[book][chapter] || {}
    timeStampMap[book][chapter][date] = true

    this._setTimeStampMap(timeStampMap)

    await addTimestamp(await this._db, book, chapter, date)
  }

  markAsUnread = async (
    book: BookAbbrev,
    chapter: ChapterID,
    date: ISODateTimeString,
  ) => {
    if (this.timeStampMap()[book][chapter][date]) {
      delete this.timeStampMap()[book][chapter][date]
      this._setTimeStampMap(this.timeStampMap())
    }
    deleteTimeStamp(this._db, book, chapter, date)
  }

  toggleShowCompleted = async () => {
    this._setShowCompleted((prev) => !prev)
    await updateSettings(this._db, this.showCompleted())
  }
}
