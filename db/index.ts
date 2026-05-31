import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

export const expo = openDatabaseSync('db.db', { enableChangeListener: true })
export const db = drizzle(expo)
