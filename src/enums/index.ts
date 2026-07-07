import dayjs from 'dayjs'
import { Enum } from 'enum-plus'

/** 更新状态 */
export const EStatus = Enum({
    /** 已完结 */
    completed: {
        value: 1,
        label: '已完结',
        color: '#f56c6c',
    },
    /** 连载中 */
    serializing: {
        value: 2,
        label: '连载中',
        color: '#409eff',
    },
    /** 即将更新 */
    toBeUpdated: {
        value: 3,
        label: '即将更新',
        color: '#FFD547',
    },
})

export const EWeekday = Enum({
    monday: {
        value: 1,
        label: '周一',
    },
    tuesday: {
        value: 2,
        label: '周二',
    },
    wednesday: {
        value: 3,
        label: '周三',
    },
    thursday: {
        value: 4,
        label: '周四',
    },
    friday: {
        value: 5,
        label: '周五',
    },
    saturday: {
        value: 6,
        label: '周六',
    },
    sunday: {
        value: 7,
        label: '周日',
    },
})

/**
 * 获取星期，返回 EWeekday 值（1-7）。
 *
 * 无参时返回当前星期，传 timestamp 时从时间戳解析原始星期。
 * 统一使用 dayjs().isoWeekday()（1=周一…7=周日）。
 * 返回值类型由 `as const` 数组自然推导为 `1|2|3|4|5|6|7`。
 */
export function getWeekday(timestamp?: number): typeof EWeekday.valueType {
    const date = timestamp ? dayjs(timestamp) : dayjs()
    const map = [
        EWeekday.monday, // isoWeekday=1 → 周一
        EWeekday.tuesday, // isoWeekday=2 → 周二
        EWeekday.wednesday, // isoWeekday=3 → 周三
        EWeekday.thursday, // isoWeekday=4 → 周四
        EWeekday.friday, // isoWeekday=5 → 周五
        EWeekday.saturday, // isoWeekday=6 → 周六
        EWeekday.sunday, // isoWeekday=7 → 周日
    ] as const
    return map[date.isoWeekday() - 1]
}
