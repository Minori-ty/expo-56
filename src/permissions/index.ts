import * as Calendar from 'expo-calendar'
import { StorageAccessFramework } from 'expo-file-system'

/**
 * 获取日历权限
 * @returns
 */
export async function getCalendarPermission() {
    try {
        const settings = await Calendar.getCalendarPermissionsAsync()
        if (settings.granted) {
            return true
        }

        const status = await Calendar.requestCalendarPermissionsAsync()
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
