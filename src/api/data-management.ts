import dayjs from 'dayjs'
import { differenceBy } from 'lodash-es'
import { z } from 'zod'

import { handleAddAnime } from '@/api'
import { getAnimeList } from '@/api/anime'
import { animeTable } from '@/db/schema'
import { exportJsonFileToDownloads, importJsonFile } from '@/utils/file'

/** 导入 JSON 校验 schema —— 模块级常量，避免每次渲染重建。 */
export const importedJsonSchema = z.object({
    animeList: z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            totalEpisode: z.number(),
            cover: z.string(),
            firstEpisodeTimestamp: z.number().gte(0),
        }),
    ),
})

/**
 * 从 DB 读取全部动漫 → 转成可导出结构 → 写到 Downloads / 私有目录。
 *
 * ⚠️ 导出时 firstEpisodeTimestamp 为**秒**（DB 存储格式），不是毫秒。
 * 重新导入时需在 importAnimeFromJsonFile 里 ×1000 转换。
 *
 * @returns 成功返回日期字符串（YYYY_MM_DD），失败或用户取消返回 undefined。
 */
export async function exportAnimeToJsonFile(): Promise<string | undefined> {
    const data = await getAnimeList()
    type AnimeRow = (typeof animeTable)['$inferSelect']
    const res = data.map(
        ({ eventIds: _eventIds, updatedAt: _updatedAt, createdAt: _createdAt, ...reset }: AnimeRow) => ({ ...reset }),
    )
    const ok = await exportJsonFileToDownloads({ animeList: res }, `anime_data_${dayjs().format('YYYY_MM_DD')}.json`)
    if (!ok) return
    return dayjs().format('YYYY_MM_DD')
}

/**
 * 让用户选择一个 JSON 文件并逐条导入到 DB。
 *
 * - schema 校验失败会返回 `{ ok: false }`（供上层弹 Toast），不抛错。
 * - 依赖 handleAddAnime（内部会写 DB + 日历）。**必须** await 每一条，
 *   否则 useMutation.onSuccess 会在真正写完前就触发。
 * - 与已存在的名字重复的记录会被忽略（differenceBy by 'name'）。
 */
export async function importAnimeFromJsonFile(): Promise<
    { ok: false; reason: 'schema-invalid' } | { ok: true; imported: number }
> {
    const jsonData = await importJsonFile()
    const parsed = importedJsonSchema.safeParse(jsonData)
    if (!parsed.success) return { ok: false, reason: 'schema-invalid' }

    const data = await getAnimeList()
    const res = differenceBy(jsonData.animeList, data, 'name')
    // ⚠️ JSON 导出时 firstEpisodeTimestamp 是秒（DB 存储格式）
    // handleAddAnime 期望毫秒输入（内部会 /1000 转回秒存 DB）
    // 因此这里必须 ×1000 秒→毫秒，否则存入库的将是错误值
    const animeList = res.map(({ id: _id, firstEpisodeTimestamp, ...reset }) => ({
        ...reset,
        firstEpisodeTimestamp: firstEpisodeTimestamp * 1000,
    }))

    // 顺序执行：handleAddAnime 内部会开 SQLite 事务并调用日历 API，
    // 并发容易互相阻塞、日历事件顺序错乱。
    for (const item of animeList) {
        await handleAddAnime(item)
    }

    return { ok: true, imported: animeList.length }
}
