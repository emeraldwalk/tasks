declare const brandKey: unique symbol
export type Brand<TID, TBaseType = string> = TBaseType & {
  [key in typeof brandKey]: TID
}

export type BookName = Brand<'BookName'>
export type BookAbbrev = Brand<'BookAbbrev'>
export type ChapterID = Brand<'ChapterID', number>
export type ISODateTimeString = Brand<'ISODateTimeString'>
export type MMDD = `${number}/${number}`

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

export interface TimeStampData {
  [bookId: BookAbbrev]: {
    [chapterId: ChapterID]: {
      [date: ISODateTimeString]: boolean
    }
  }
}
