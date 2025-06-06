import type {
  BookAbbrev,
  ChapterID,
  ISODateTimeString,
  SettingsData,
  TimeStampMap,
} from './model'

const SETTINGS_STORE_NAME = 'settings'
const TIMESTAMPS_STORE_NAME = 'timestamps'

export type TimeStampKey = `${ISODateTimeString}_${BookAbbrev}_${ChapterID}`

interface SettingsRecord {
  id: '1'
  showCompleted: boolean
}

interface TimestampRecord {
  id: TimeStampKey
}

function createKey(
  date: ISODateTimeString,
  book: BookAbbrev,
  chapter: ChapterID,
): TimeStampKey {
  return `${date}_${book}_${chapter}`
}

function parseKey(
  key: TimeStampKey,
): [ISODateTimeString, BookAbbrev, ChapterID] {
  return key.split('_') as [ISODateTimeString, BookAbbrev, ChapterID]
}

/** Initialize IndexDB */
export async function initDb(): Promise<IDBDatabase> {
  const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>()

  const request = indexedDB.open('BibleReadDB', 2)

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result
    if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
      db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(TIMESTAMPS_STORE_NAME)) {
      db.createObjectStore(TIMESTAMPS_STORE_NAME, { keyPath: 'id' })
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

async function putRecord(
  db: IDBDatabase,
  storeName: typeof SETTINGS_STORE_NAME,
  record: SettingsRecord,
): Promise<void>
async function putRecord(
  db: IDBDatabase,
  storeName: typeof TIMESTAMPS_STORE_NAME,
  record: TimestampRecord,
): Promise<void>
async function putRecord(
  db: IDBDatabase,
  storeName: string,
  record: SettingsRecord | TimestampRecord,
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  const transaction = db.transaction([storeName], 'readwrite')
  const store = transaction.objectStore(storeName)

  const request = store.put(record)

  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)

  transaction.oncomplete = () => {
    // Transaction completed successfully
  }
  transaction.onerror = () => reject(transaction.error)

  return promise
}

/** Add a timestamp for a Bible chapter that was read */
export async function addTimestamp(
  db: IDBDatabase,
  book: BookAbbrev,
  chapter: ChapterID,
  date: ISODateTimeString,
): Promise<void> {
  const record: TimestampRecord = {
    id: createKey(date, book, chapter),
  }

  return putRecord(db, TIMESTAMPS_STORE_NAME, record)
}

/** Update the settings record */
export async function updateSettings(db: IDBDatabase, showCompleted: boolean) {
  const record: SettingsRecord = {
    id: '1',
    showCompleted,
  }

  return putRecord(db, SETTINGS_STORE_NAME, record)
}

/** Delete timestamps */
export async function deleteTimeStamp(
  db: IDBDatabase,
  book: BookAbbrev,
  chapter: ChapterID,
  date: ISODateTimeString,
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  const transaction = db.transaction([TIMESTAMPS_STORE_NAME], 'readwrite')
  const store = transaction.objectStore(TIMESTAMPS_STORE_NAME)

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

/** Get Settings record */
export async function getSettingsData(db: IDBDatabase): Promise<SettingsData> {
  const { promise, resolve, reject } = Promise.withResolvers<SettingsData>()
  const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly')
  const store = transaction.objectStore(SETTINGS_STORE_NAME)
  const request = store.get('1')

  request.onsuccess = (event) => {
    const result = (event.target as IDBRequest<SettingsRecord>).result
    resolve({
      showCompleted: result?.showCompleted ?? true,
    })
  }

  request.onerror = () => reject(request.error)

  return promise
}

/** Get timestamp data */
export async function getTimeStampMap(db: IDBDatabase): Promise<TimeStampMap> {
  const { promise, resolve, reject } = Promise.withResolvers<TimeStampMap>()

  const transaction = db.transaction([TIMESTAMPS_STORE_NAME], 'readonly')
  const store = transaction.objectStore(TIMESTAMPS_STORE_NAME)
  // const keyRange = IDBKeyRange.bound(`${book}-`, `${book}.\uffff`) // Match all keys starting with "book-"
  // const request = store.openCursor(keyRange)
  const request = store.openCursor()
  const result: TimeStampMap = {}

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
