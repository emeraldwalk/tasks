import type {
  BookID,
  ChapterID,
  ISODateTimeString,
  TimeStampData,
} from './model'

type Key = `${BookID}_${ChapterID}_${ISODateTimeString}`

interface TimestampRecord {
  id: Key
}

function parseKey(key: Key): [BookID, ChapterID, ISODateTimeString] {
  return key.split('_') as [BookID, ChapterID, ISODateTimeString]
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
  book: BookID,
  chapter: ChapterID,
  date: ISODateTimeString,
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  const transaction = db.transaction(['timestamps'], 'readwrite')
  const store = transaction.objectStore('timestamps')

  const entry: TimestampRecord = {
    id: `${book}_${chapter}_${date}`,
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
      const [book, chapter, date] = parseKey(cursor.value.id)

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
