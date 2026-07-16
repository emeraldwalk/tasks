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
  targetDays: number
  cutoffDays: number | null
  cutoffDate: string | null
  showAllDates: boolean
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
  version: 1
  exportedAt: ISODateTimeString
  recordCount: number
  settings: {
    perDayTagData: PerDayTagData[]
  }
  timestamps: TimeStampData[]
}
