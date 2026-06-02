import * as Calendar from 'expo-calendar'
import { File } from 'expo-file-system'

/**
 * 获取日历权限
 * @returns
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
        // 弹出系统文件选择器（Android）
        const file = await File.pickFileAsync();

        if (!file.result) {
            return null;
        }
        return file.result.uri;
    } catch (error) {
        console.error(error);
        return null;
    }
}
