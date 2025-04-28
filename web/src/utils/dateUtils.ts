import type { ISODateTimeString } from '../data/model'

export function now(): ISODateTimeString {
  return new Date().toISOString() as ISODateTimeString
}
