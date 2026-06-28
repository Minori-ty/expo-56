import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** 动漫列表数据表 */
export const animeTable = sqliteTable('anime', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    name: text('name').notNull(),
    totalEpisode: integer('total_episode').notNull(),
    cover: text('cover').notNull(),
    /** unix时间戳（秒），不是毫秒。导入/导出 JSON 时注意转换 */
    createdAt: integer('created_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳（秒），不是毫秒。导入/导出 JSON 时注意转换 */
    updatedAt: integer('updated_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳（秒），不是毫秒。导入/导出 JSON 时注意转换 */
    firstEpisodeTimestamp: integer('first_episode_timestamp').notNull(),
    /** 日历事件ID数组 */
    eventIds: text('event_ids', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default(sql`'[]'`),
})
