import type { ISODateTimeString, MMDD, MMDDYYYY } from '../data/model'

export function localDateTimeString(dateTimeStr: ISODateTimeString) {
  const date = new Date(dateTimeStr)
  return date
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(',', '')
}

export function mmDD(dateTimeStr: ISODateTimeString): MMDD {
  return dateTimeStr.substring(5, 10).replace('-', '/') as MMDD
}

export function mmDDYYYY(dateTimeStr: ISODateTimeString): MMDDYYYY {
  const [, year, month, day] =
    /^(\d{4})-(\d{2})-(\d{2})/.exec(dateTimeStr) ?? []

  return `${month}/${day}/${year}` as MMDDYYYY
}

export function now(): ISODateTimeString {
  return new Date().toISOString() as ISODateTimeString
}
