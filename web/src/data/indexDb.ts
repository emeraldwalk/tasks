import type {
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  TimeStampData,
} from './model'

type Key = `${ISODateTimeString}_${BookAbbrev}_${ChapterID}`

interface TimestampRecord {
  id: Key
}

function createKey(
  date: ISODateTimeString,
  book: BookAbbrev,
  chapter: ChapterID,
): Key {
  return `${date}_${book}_${chapter}`
}

function parseKey(key: Key): [ISODateTimeString, BookAbbrev, ChapterID] {
  return key.split('_') as [ISODateTimeString, BookAbbrev, ChapterID]
}

export async function initDb(): Promise<IDBDatabase> {
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>()

  const request = indexedDB.open('BibleReadDB', 1)

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result
    if (!db.objectStoreNames.contains('timestamps')) {
      db.createObjectStore('timestamps', { keyPath: 'id' })
    }
  }

  request.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result
    resolve(db)
  }

  request.onerror = (event) => {
    reject((event.target as IDBOpenDBRequest).error)
  }

  return promise
}

export async function addTimestamp(
  db: IDBDatabase,
  book: BookAbbrev,
  chapter: ChapterID,
  date: ISODateTimeString,
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  const transaction = db.transaction(['timestamps'], 'readwrite')
  const store = transaction.objectStore('timestamps')

  const entry: TimestampRecord = {
    id: createKey(date, book, chapter),
  }

  const request = store.put(entry)

  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)

  transaction.oncomplete = () => {
    // Transaction completed successfully
  }
  transaction.onerror = () => reject(transaction.error)

  return promise
}

export async function deleteTimeStamp(
  db: IDBDatabase,
  book: BookAbbrev,
  chapter: ChapterID,
  date: ISODateTimeString,
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  const transaction = db.transaction(['timestamps'], 'readwrite')
  const store = transaction.objectStore('timestamps')

  // Generate the key for the entry to delete
  const key = createKey(date, book, chapter)

  // Delete the entry with the specified key
  const request = store.delete(key)

  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)

  transaction.oncomplete = () => {}
  transaction.onerror = () => reject(transaction.error)

  return promise
}

export async function getTimeStampData(
  db: IDBDatabase,
): Promise<TimeStampData> {
  const { promise, resolve, reject } = Promise.withResolvers<TimeStampData>()

  const transaction = (await db).transaction(['timestamps'], 'readonly')
  const store = transaction.objectStore('timestamps')
  // const keyRange = IDBKeyRange.bound(`${book}-`, `${book}.\uffff`) // Match all keys starting with "book-"
  // const request = store.openCursor(keyRange)
  const request = store.openCursor()
  const result: TimeStampData = {}

  request.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
    if (cursor) {
      const [date, book, chapter] = parseKey(cursor.value.id)

      result[book] = result[book] || {}
      result[book][chapter] = result[book][chapter] || {}
      result[book][chapter][date] = true

      cursor.continue()
    } else {
      resolve(result)
    }
  }

  request.onerror = () => reject(request.error)

  return promise
}
