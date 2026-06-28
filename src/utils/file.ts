import { File, Paths } from 'expo-file-system'
import { StorageAccessFramework, writeAsStringAsync } from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import type { DeepExpand } from 'types-tools'

import { animeTable } from '@/db/schema'

/** 应用文档目录 */
export const DIR = Paths.document

type TAnime = DeepExpand<Omit<typeof animeTable.$inferSelect, 'createdAt' | 'updatedAt' | 'eventIds'>>
type TJsonFileData = DeepExpand<{ animeList: TAnime[] }>

/**
 * 导出数据为json文件（保存到 app 私有目录）
 */
export async function exportJsonFile(data: TJsonFileData, filename: string) {
    if (!filename.endsWith('.json')) {
        filename += '.json'
    }

    const file = new File(DIR, filename)
    const content = JSON.stringify(data, null, 2)
    file.write(content)

    return true
}

/**
 * 导出数据为json文件到公共 Downloads 目录（Android 通过 SAF）
 *
 * Android: StorageAccessFramework 写入系统 Downloads 文件夹
 * iOS: 回退到 app 私有文档目录（iOS 无公共 Downloads 概念）
 */
export async function exportJsonFileToDownloads(data: TJsonFileData, filename: string) {
    if (!filename.endsWith('.json')) {
        filename += '.json'
    }

    const content = JSON.stringify(data, null, 2)

    if (Platform.OS === 'android') {
        const safUri = StorageAccessFramework.getUriForDirectoryInRoot('Download')
        const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync(safUri)

        if (!permission.granted) {
            throw new Error('用户未授权访问 Downloads 目录')
        }

        // SAF 要求文件名不含扩展名，扩展名通过 MIME 类型指定
        const nameWithoutExt = filename.replace(/\.json$/, '')
        const fileUri = await StorageAccessFramework.createFileAsync(
            permission.directoryUri,
            nameWithoutExt,
            'application/json',
        )
        await writeAsStringAsync(fileUri, content, { encoding: 'utf8' })

        return true
    }

    // iOS: 回退到 app 私有目录
    return exportJsonFile(data, filename)
}

/**
 * 导入json文件数据
 */
export async function importJsonFile(): Promise<TJsonFileData> {
    const result = await File.pickFileAsync({
        mimeTypes: ['application/json'],
    })

    if (result.canceled || !result.result) {
        throw Error('用户取消选择')
    }

    const file = result.result
    const content = await file.text()

    const data = JSON.parse(content)
    return data
}

/**
 * 扫描应用文档目录中的json文件
 */
export async function scanJsonFile(): Promise<{ name: string; size: number }[]> {
    const items = DIR.list()

    const jsonFiles: { name: string; size: number }[] = []

    for (const item of items) {
        if (item instanceof File && item.name.endsWith('.json')) {
            jsonFiles.push({
                name: item.name,
                size: item.size ?? 0,
            })
        }
    }

    return jsonFiles
}

/**
 * 删除json文件
 */
export async function deleteJsonFile(fileName: string): Promise<boolean> {
    if (!fileName.endsWith('.json')) {
        fileName += '.json'
    }

    const file = new File(DIR, fileName)
    file.delete()

    return true
}

/**
 * 批量删除json文件
 */
export async function deleteJsonFileList(fileNameList: string[]) {
    return await Promise.all(fileNameList.map(deleteJsonFile))
}
