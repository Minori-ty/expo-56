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
 * 无参时返回当前星期（用 dayjs().day()，0=周日…6=周六 映射）。
 * 传 timestamp 时从时间戳解析原始星期（用 dayjs().isoWeekday()，1=周一…7=周日）。
 * 返回值类型由 `as const` 数组自然推导为 `1|2|3|4|5|6|7`，无需类型断言。
 */
export function getCurrentWeekday(timestamp?: number): typeof EWeekday.valueType {
    if (timestamp !== undefined) {
        // isoWeekday 1-7 → 数组下标 0-6
        const map = [
            EWeekday.monday, // isoWeekday=1 → 周一
            EWeekday.tuesday, // isoWeekday=2 → 周二
            EWeekday.wednesday, // isoWeekday=3 → 周三
            EWeekday.thursday, // isoWeekday=4 → 周四
            EWeekday.friday, // isoWeekday=5 → 周五
            EWeekday.saturday, // isoWeekday=6 → 周六
            EWeekday.sunday, // isoWeekday=7 → 周日
        ] as const
        return map[dayjs(timestamp).isoWeekday() - 1]
    }

    // dayjs day 0-6 → 数组下标 0-6
    const map = [
        EWeekday.sunday, // dayjs day=0 → 周日
        EWeekday.monday, // dayjs day=1 → 周一
        EWeekday.tuesday, // dayjs day=2 → 周二
        EWeekday.wednesday, // dayjs day=3 → 周三
        EWeekday.thursday, // dayjs day=4 → 周四
        EWeekday.friday, // dayjs day=5 → 周五
        EWeekday.saturday, // dayjs day=6 → 周六
    ] as const
    return map[dayjs().day()]
}
