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
 * 获取当前是周几，返回 EWeekday 值（1-7）。
 *
 * 用 EWeekday 枚举值构成数组，通过 dayjs().day()（0=周日…6=周六）下标取值，
 * 返回值类型由 `as const` 数组自然推导为 `1|2|3|4|5|6|7`，无需类型断言。
 */
export function getCurrentWeekday(): typeof EWeekday.valueType {
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
