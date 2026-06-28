import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** 动漫列表数据表 */
export const animeTable = sqliteTable('anime', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    name: text('name').notNull(),
    totalEpisode: integer('total_episode').notNull(),
    cover: text('cover').notNull(),
    /** unix时间戳 */
    createdAt: integer('created_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳 */
    updatedAt: integer('updated_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳 */
    firstEpisodeTimestamp: integer('first_episode_timestamp').notNull(),
    /** 日历事件ID数组 */
    eventIds: text('event_ids', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default(sql`'[]'`),
})
