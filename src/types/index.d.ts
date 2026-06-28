import type { IAnime } from '@/api/anime'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core'
import type { SQLiteRunResult } from 'expo-sqlite'
import type { DeepExpand } from 'types-tools'

export type TTx = SQLiteTransaction<
    'sync',
    SQLiteRunResult,
    Record<string, never>,
    ExtractTablesWithRelations<Record<string, never>>
>

export type TAnimeList = DeepExpand<IAnime>[]
