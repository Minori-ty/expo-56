import { getCalendarPermissions, requestCalendarPermissions } from 'expo-calendar'

export interface CalendarPermissionResult {
    /** 是否已授权 */
    granted: boolean
    /**
     * 是否还能再次弹出系统权限对话框。
     * false 表示用户选择了"拒绝且不再询问"，此时只能引导去系统设置。
     */
    canAskAgain: boolean
}

/**
 * 获取日历权限
 *
 * 优先检查已有权限，未决定时弹出系统对话框。
 * 返回值区分"拒绝"与"永久拒绝"两种场景，便于上层给出不同反馈。
 */
export async function getCalendarPermission(): Promise<CalendarPermissionResult> {
    try {
        const settings = await getCalendarPermissions()
        if (settings.granted) {
            return { granted: true, canAskAgain: true }
        }

        const status = await requestCalendarPermissions()
        return { granted: status.granted, canAskAgain: status.canAskAgain }
    } catch (error) {
        alert(`获取日历权限失败${error}`)
        return { granted: false, canAskAgain: true }
    }
}
