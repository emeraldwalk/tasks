declare const brandKey: unique symbol
export type Brand<TID, TBaseType = string> = TBaseType & {
  [key in typeof brandKey]: TID
}

export type BookID = Brand<'BookID'>
export type ChapterID = Brand<'ChapterID', number>
export type ISODateTimeString = Brand<'ISODateTimeString'>
export type MMDD = `${number}/${number}`

export interface BibleBookMeta {
  name: string
  abbrev: BookID
  chapterCount: number
}

export interface TimeStampData {
  [bookId: BookID]: {
    [chapterId: ChapterID]: {
      [date: ISODateTimeString]: boolean
    }
  }
}
