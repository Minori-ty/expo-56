import * as Calendar from 'expo-calendar'
import { StorageAccessFramework } from 'expo-file-system/legacy'

/**
 * 获取日历权限
 * @returns
 */
export async function getCalendarPermission() {
    console.log(Calendar.getCalendarPermissions)
    try {
        const settings = await Calendar.getCalendarPermissions()
        if (settings.granted) {
            return true
        }

        const status = await Calendar.requestCalendarPermissions()
        return status.granted
    } catch (error) {
        alert('获取日历权限失败' + error)
        return false
    }
}

/**
 * 获取文件存储权限和目录
 * @returns
 */
export async function getFileExportsPermission() {
    try {
        const settings = await StorageAccessFramework.requestDirectoryPermissionsAsync()
        if (settings.granted) {
            return settings.directoryUri
        }
        alert('获取文件存储权限失败')
        return false
    } catch (error) {
        alert('获取文件存储权限失败' + error)
        return false
    }
}
