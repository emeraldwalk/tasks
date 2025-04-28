import type { ISODateTimeString, MMDD } from '../data/model'

export function mmDD(dateTimeStr: ISODateTimeString): MMDD {
  return dateTimeStr.substring(5, 10).replace('-', '/') as MMDD
}

export function now(): ISODateTimeString {
  return new Date().toISOString() as ISODateTimeString
}
