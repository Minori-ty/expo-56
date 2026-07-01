import { EStatus } from '@/enums'

import type { FieldName } from './fieldRegistry'

/**
 * status → 渲染字段名列表（顺序即 UI 顺序）。
 *
 * 新增状态或字段时，只需改本表与 fieldRegistry，Renderer 零改动。
 * 字段顺序与原 BaseForm 中各 status 分支的 JSX 顺序保持一致：
 *   serializing: 更新周 / 更新时间 / 当前更新集数（状态、名称、总集数、封面为公共）
 *   completed:   首播(只读) / 完结(可编辑)
 *   toBeUpdated: 首播(可编辑) / 完结(只读)
 */
export const statusFieldMap: Record<typeof EStatus.valueType, FieldName[]> = {
    [EStatus.serializing]: ['name', 'status', 'updateWeekday', 'updateTime', 'currentEpisode', 'totalEpisode', 'cover'],
    [EStatus.completed]: ['name', 'status', 'firstEpisode', 'lastEpisode', 'totalEpisode', 'cover'],
    [EStatus.toBeUpdated]: ['name', 'status', 'firstEpisode', 'totalEpisode', 'cover'],
}
