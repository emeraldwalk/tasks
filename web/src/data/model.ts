declare const brandKey: unique symbol
export type Brand<TID, TBaseType = string> = TBaseType & {
  [key in typeof brandKey]: TID
}

export type BookName = Brand<'BookName'>
export type BookAbbrev = Brand<'BookAbbrev'>
export type ChapterID = Brand<'ChapterID', number>
export type ISODateTimeString = Brand<'ISODateTimeString'>
export type MMDDYY = `${number}/${number}/${number}`
export type MMDDYYYY = `${number}/${number}/${number}`
export type Tag = Brand<'Tag'>
export type PlanId = Brand<'PlanId'>

export interface BookData {
  name: BookName
  abbrev: BookAbbrev
  chapterCount: number
}

export interface ChapterData {
  name: BookName
  abbrev: BookAbbrev
  number: ChapterID
}

export interface ChapterGroupData {
  name: string
  chapters: ChapterData[]
}

export type TagRecord = Record<Tag, Record<BookAbbrev, boolean>>

export type TagDescriptions = Record<Tag, string>

export interface SettingsData {
  showCompleted: boolean
  cutoffDays: number | null
  cutoffDate: string | null
  showAllDates: boolean
  plans: ReadingPlan[]
  activePlanId: PlanId
}

export interface ReadingPlan {
  id: PlanId
  name: string
  targetDays: number
  perDayTagData: PerDayTagData[]
}

export interface PerDayTagData {
  tags: Tag[]
  count: number
}

export interface TimeStampData {
  date: ISODateTimeString
  book: BookAbbrev
  chapter: ChapterID
}

export interface TimeStampMap {
  [bookId: BookAbbrev]: {
    [chapterId: ChapterID]: {
      [date: ISODateTimeString]: boolean
    }
  }
}

export interface ExportFormat {
  version: 2
  exportedAt: ISODateTimeString
  recordCount: number
  settings: {
    plans: ReadingPlan[]
    activePlanId: PlanId
  }
  timestamps: TimeStampData[]
}
