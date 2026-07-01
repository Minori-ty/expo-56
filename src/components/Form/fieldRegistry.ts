import { CoverField } from './fields/CoverField'
import { CurrentEpisodeField } from './fields/CurrentEpisodeField'
import { FirstEpisodeField } from './fields/FirstEpisodeField'
import { LastEpisodeField } from './fields/LastEpisodeField'
import { NameField } from './fields/NameField'
import { StatusField } from './fields/StatusField'
import { TotalEpisodeField } from './fields/TotalEpisodeField'
import type { FieldComponent } from './fields/types.d'
import { UpdateTimeField } from './fields/UpdateTimeField'
import { UpdateWeekdayField } from './fields/UpdateWeekdayField'

/**
 * 字段名 —— 同时作为 fieldRegistry 的 key 与 statusFieldMap 的元素类型。
 * 命名与表单值字段（AnimeFormValues 的 key）解耦：这里用语义化短名，
 * 由各 Field 组件内部自行绑定到对应 form.Field name。
 */
export type FieldName =
    | 'name'
    | 'status'
    | 'firstEpisode'
    | 'lastEpisode'
    | 'updateWeekday'
    | 'updateTime'
    | 'currentEpisode'
    | 'totalEpisode'
    | 'cover'

/**
 * Field Metadata：组件 + label。
 * Renderer 只读本表，不关心任何业务。新增字段只需在此注册。
 */
export const fieldRegistry: Record<FieldName, { component: FieldComponent; label: string }> = {
    name: { component: NameField, label: '番剧名称' },
    status: { component: StatusField, label: '更新状态' },
    firstEpisode: { component: FirstEpisodeField, label: '首播时间' },
    lastEpisode: { component: LastEpisodeField, label: '完结时间' },
    updateWeekday: { component: UpdateWeekdayField, label: '更新周' },
    updateTime: { component: UpdateTimeField, label: '更新时间(HH:mm)' },
    currentEpisode: { component: CurrentEpisodeField, label: '当前更新集数' },
    totalEpisode: { component: TotalEpisodeField, label: '总集数' },
    cover: { component: CoverField, label: '封面URL' },
}
