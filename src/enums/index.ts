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
