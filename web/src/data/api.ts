import type {
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  TimeStampMap,
  ChapterData,
  TagRecord,
  TagDescriptions,
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
import { getChapterData, getTagDescriptions, getTagsData, keys } from '../utils/dataUtils'

export class Api {
  static create = async (): Promise<Api> => {
    const db = await initDb()
    const timeStampMap = await getTimeStampMap(db)
    const chapterData = getChapterData()
    const settingsData = await getSettingsData(db)
    const tagsData = getTagsData()
    const tagDescriptions = getTagDescriptions()
    return new Api(db, timeStampMap, chapterData, settingsData, tagsData, tagDescriptions)
  }

  constructor(
    db: IDBDatabase,
    timeStampMap: TimeStampMap,
    chapterData: ChapterData[],
    settingsData: SettingsData,
    tagsData: TagRecord,
    tagDescriptions: TagDescriptions,
  ) {
    this._db = db
    this._chapterData = chapterData
    this._settingsData = settingsData
    this._tagsData = tagsData
    this._tagDescriptions = tagDescriptions

    // perDayTagData signal
    const [perDayTagData, setPerDayTagData] = createSignal<PerDayTagData[]>(
      settingsData.perDayTagData,
    )
    this.perDayTagData = perDayTagData
    this._setPerDayTagData = setPerDayTagData

    // targetDays signal
    const [targetDays, setTargetDays] = createSignal(settingsData.targetDays)
    this.targetDays = targetDays
    this._setTargetDays = setTargetDays

    // cutoffDays signal
    const [cutoffDays, setCutoffDays] = createSignal<number | null>(settingsData.cutoffDays)
    this.cutoffDays = cutoffDays
    this._setCutoffDays = setCutoffDays

    // cutoffDate signal
    const [cutoffDate, setCutoffDate] = createSignal<string | null>(settingsData.cutoffDate)
    this.cutoffDate = cutoffDate
    this._setCutoffDate = setCutoffDate

    // showAllDates signal
    const [showAllDates, setShowAllDates] = createSignal<boolean>(
      settingsData.showAllDates,
    )
    this.showAllDates = showAllDates
    this._setShowAllDates = setShowAllDates

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
  private readonly _tagDescriptions: TagDescriptions
  private readonly _setShowCompleted: Setter<boolean>
  private readonly _setTargetDays: Setter<number>
  private readonly _setCutoffDays: Setter<number | null>
  private readonly _setCutoffDate: Setter<string | null>
  private readonly _setShowAllDates: Setter<boolean>
  private readonly _setPerDayTagData: Setter<PerDayTagData[]>
  private readonly _setTimeStampMap: Setter<TimeStampMap>

  readonly perDayTagData: Accessor<PerDayTagData[]>
  readonly targetDays: Accessor<number>
  readonly cutoffDays: Accessor<number | null>
  readonly cutoffDate: Accessor<string | null>
  readonly showAllDates: Accessor<boolean>
  readonly searchText: Accessor<string>
  readonly setSearchText: Setter<string>
  readonly showCompleted: Accessor<boolean>
  readonly timeStampMap: Accessor<TimeStampMap>

  private currentSettings = (): SettingsData => ({
    showCompleted: this.showCompleted(),
    targetDays: this.targetDays(),
    cutoffDays: this.cutoffDays(),
    cutoffDate: this.cutoffDate(),
    showAllDates: this.showAllDates(),
    perDayTagData: this.perDayTagData(),
  })

  private effectiveCutoff = (): string | null => {
    const days = this.cutoffDays()
    const rolling = days != null
      ? new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      : null
    const candidates = [rolling, this.cutoffDate()].filter(Boolean) as string[]
    return candidates.length ? candidates.toSorted().at(-1)! : null
  }

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

  getTagDescriptions = (): TagDescriptions => {
    return this._tagDescriptions
  }

  hasChapterDates = ({
    abbrev,
    number,
  }: Pick<ChapterData, 'abbrev' | 'number'>) => {
    const dates = this.getChapterDates({ abbrev, number })
    const cutoff = this.effectiveCutoff()
    if (!cutoff) return dates.length > 0
    return dates.some((d) => d.slice(0, 10) >= cutoff)
  }

  filterDatesToCutoff = (dates: ISODateTimeString[]): ISODateTimeString[] => {
    if (this.showAllDates()) return dates
    const cutoff = this.effectiveCutoff()
    if (!cutoff) return dates
    return dates.filter((d) => d.slice(0, 10) >= cutoff)
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

  setPerDayTagData = async (
    valueOrUpdater: PerDayTagData[] | ((prev: PerDayTagData[]) => PerDayTagData[]),
  ) => {
    this._setPerDayTagData(valueOrUpdater as PerDayTagData[])
    await updateSettings(this._db, this.currentSettings())
  }

  setTargetDays = async (value: number) => {
    this._setTargetDays(value)
    await updateSettings(this._db, this.currentSettings())
  }

  setCutoffDays = async (value: number | null) => {
    this._setCutoffDays(value)
    await updateSettings(this._db, this.currentSettings())
  }

  setCutoffDate = async (value: string | null) => {
    this._setCutoffDate(value)
    await updateSettings(this._db, this.currentSettings())
  }

  setShowAllDates = async (value: boolean) => {
    this._setShowAllDates(value)
    await updateSettings(this._db, this.currentSettings())
  }

  toggleShowCompleted = async () => {
    this._setShowCompleted((prev) => !prev)
    await updateSettings(this._db, this.currentSettings())
  }

  exportData = (): string => {
    const timestamps = this.getTimeStampData()
    const settings = {
      // showCompleted intentionally omitted — UI preference, not backup data
      perDayTagData: this.perDayTagData(),
    }
    const output = {
      version: 1,
      exportedAt: new Date().toISOString(),
      recordCount: timestamps.length,
      settings,
      timestamps,
    }
    return JSON.stringify(output, null, 2)
  }

  importData = async (file: File): Promise<{ imported: number; skipped: number }> => {
    const text = await file.text()
    const data = JSON.parse(text)
    if (data.version !== 1) throw new Error(`Unknown export version: ${data.version}`)

    let imported = 0, skipped = 0
    for (const { date, book, chapter } of data.timestamps) {
      if (!this.timeStampMap()[book]?.[chapter]?.[date]) {
        await this.markAsRead(book, chapter as ChapterID, date)
        imported++
      } else {
        skipped++
      }
    }

    if (data.settings) {
      const s = data.settings
      // showCompleted intentionally excluded — persisted UI preference, not backup data
      if (Array.isArray(s.perDayTagData)) this.setPerDayTagData(s.perDayTagData)
    }

    return { imported, skipped }
  }
}
