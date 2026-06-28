import * as Calendar from 'expo-calendar'

/**
 * 获取日历权限
 */
export async function getCalendarPermission() {
    try {
        const settings = await Calendar.getCalendarPermissions()
        if (settings.granted) {
            return true
        }

        const status = await Calendar.requestCalendarPermissions()
        return status.granted
    } catch (error) {
        alert(`获取日历权限失败${error}`)
        return false
    }
}
