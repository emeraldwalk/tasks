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
  PlanId,
  ReadingPlan,
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
import {
  getBookTagDescriptions,
  getBookTagsData,
  getChapterData,
  getTagDescriptions,
  getTagsData,
  keys,
} from '../utils/dataUtils'

export class Api {
  static create = async (): Promise<Api> => {
    const db = await initDb()
    const timeStampMap = await getTimeStampMap(db)
    const chapterData = getChapterData()
    const settingsData = await getSettingsData(db)
    const tagsData = getTagsData()
    const tagDescriptions = getTagDescriptions()
    const bookTagsData = getBookTagsData(chapterData)
    const bookTagDescriptions = getBookTagDescriptions(chapterData)
    return new Api(
      db,
      timeStampMap,
      chapterData,
      settingsData,
      tagsData,
      tagDescriptions,
      bookTagsData,
      bookTagDescriptions,
    )
  }

  constructor(
    db: IDBDatabase,
    timeStampMap: TimeStampMap,
    chapterData: ChapterData[],
    settingsData: SettingsData,
    tagsData: TagRecord,
    tagDescriptions: TagDescriptions,
    bookTagsData: TagRecord,
    bookTagDescriptions: TagDescriptions,
  ) {
    this._db = db
    this._chapterData = chapterData
    this._settingsData = settingsData
    this._tagsData = tagsData
    this._tagDescriptions = tagDescriptions
    this._bookTagsData = bookTagsData
    this._bookTagDescriptions = bookTagDescriptions
    this._allTagsData = { ...tagsData, ...bookTagsData }

    // plans signal
    const [plans, setPlans] = createSignal<ReadingPlan[]>(settingsData.plans)
    this.plans = plans
    this._setPlans = setPlans

    // activePlanId signal
    const [activePlanId, setActivePlanId] = createSignal<PlanId>(
      settingsData.activePlanId,
    )
    this.activePlanId = activePlanId
    this._setActivePlanId = setActivePlanId

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
  private readonly _bookTagsData: TagRecord
  private readonly _bookTagDescriptions: TagDescriptions
  private readonly _allTagsData: TagRecord
  private readonly _setShowCompleted: Setter<boolean>
  private readonly _setCutoffDays: Setter<number | null>
  private readonly _setCutoffDate: Setter<string | null>
  private readonly _setShowAllDates: Setter<boolean>
  private readonly _setPlans: Setter<ReadingPlan[]>
  private readonly _setActivePlanId: Setter<PlanId>
  private readonly _setTimeStampMap: Setter<TimeStampMap>

  readonly plans: Accessor<ReadingPlan[]>
  readonly activePlanId: Accessor<PlanId>
  readonly cutoffDays: Accessor<number | null>
  readonly cutoffDate: Accessor<string | null>
  readonly showAllDates: Accessor<boolean>
  readonly searchText: Accessor<string>
  readonly setSearchText: Setter<string>
  readonly showCompleted: Accessor<boolean>
  readonly timeStampMap: Accessor<TimeStampMap>

  private currentSettings = (): SettingsData => ({
    showCompleted: this.showCompleted(),
    cutoffDays: this.cutoffDays(),
    cutoffDate: this.cutoffDate(),
    showAllDates: this.showAllDates(),
    plans: this.plans(),
    activePlanId: this.activePlanId(),
  })

  /** The plan currently driving the reading list; falls back to the first plan. */
  activePlan = (): ReadingPlan => {
    const plans = this.plans()
    return plans.find((p) => p.id === this.activePlanId()) ?? plans[0]
  }

  perDayTagData = (): PerDayTagData[] => this.activePlan().perDayTagData

  targetDays = (): number => this.activePlan().targetDays

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

  /** One pseudo-tag per Bible book (e.g. "Genesis"), each covering just that book. */
  getBookTags = (): TagRecord => {
    return this._bookTagsData
  }

  getBookTagDescriptions = (): TagDescriptions => {
    return this._bookTagDescriptions
  }

  /** getTags() ∪ getBookTags() — what chapter-pool resolution (plan generation, group stats) needs. */
  getAllTags = (): TagRecord => {
    return this._allTagsData
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

  /** Updates the active plan's tag groups. */
  setPerDayTagData = async (
    valueOrUpdater: PerDayTagData[] | ((prev: PerDayTagData[]) => PerDayTagData[]),
  ) => {
    await this.updatePlan(this.activePlanId(), (plan) => ({
      ...plan,
      perDayTagData:
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(plan.perDayTagData)
          : valueOrUpdater,
    }))
  }

  /** Updates the active plan's target day count. */
  setTargetDays = async (value: number) => {
    await this.updatePlan(this.activePlanId(), (plan) => ({ ...plan, targetDays: value }))
  }

  addPlan = async (name: string): Promise<PlanId> => {
    const id = crypto.randomUUID() as PlanId
    const plan: ReadingPlan = { id, name, targetDays: 365, perDayTagData: [] }
    this._setPlans((prev) => [...prev, plan])
    await updateSettings(this._db, this.currentSettings())
    return id
  }

  renamePlan = async (id: PlanId, name: string) => {
    await this.updatePlan(id, (plan) => ({ ...plan, name }))
  }

  /** Removes a plan. No-ops if it's the last remaining plan. If the active plan is removed, the first remaining plan becomes active. */
  removePlan = async (id: PlanId) => {
    const remaining = this.plans().filter((p) => p.id !== id)
    if (remaining.length === this.plans().length || remaining.length === 0) return

    this._setPlans(remaining)
    if (this.activePlanId() === id) {
      this._setActivePlanId(remaining[0].id)
    }
    await updateSettings(this._db, this.currentSettings())
  }

  setActivePlanId = async (id: PlanId) => {
    this._setActivePlanId(id)
    await updateSettings(this._db, this.currentSettings())
  }

  private updatePlan = async (
    id: PlanId,
    updater: (plan: ReadingPlan) => ReadingPlan,
  ) => {
    this._setPlans((prev) => prev.map((plan) => (plan.id === id ? updater(plan) : plan)))
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
      plans: this.plans(),
      activePlanId: this.activePlanId(),
    }
    const output = {
      version: 2,
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
    if (data.version !== 1 && data.version !== 2) {
      throw new Error(`Unknown export version: ${data.version}`)
    }

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
      if (Array.isArray(s.plans) && s.plans.length > 0) {
        // v2: full plan list
        this._setPlans(s.plans)
        const activeId = s.plans.some((p: ReadingPlan) => p.id === s.activePlanId)
          ? s.activePlanId
          : s.plans[0].id
        this._setActivePlanId(activeId)
        await updateSettings(this._db, this.currentSettings())
      } else if (Array.isArray(s.perDayTagData)) {
        // v1: bare tag groups, folded into the active plan
        await this.setPerDayTagData(s.perDayTagData)
      }
    }

    return { imported, skipped }
  }
}
