import { eq } from 'drizzle-orm'
import { Directory, File, Paths } from 'expo-file-system'
import { Platform } from 'react-native'
import type { DeepExpand } from 'types-tools'

import { db } from '@/db'
import { animeTable, settingsTable } from '@/db/schema'

/** 应用文档目录 */
export const DIR = Paths.document

type TAnime = DeepExpand<Omit<typeof animeTable.$inferSelect, 'createdAt' | 'updatedAt' | 'eventIds'>>
type TJsonFileData = DeepExpand<{ animeList: TAnime[] }>

/** 缓存用户选择的导出目录，避免每次都要选 */
let savedExportDir: Directory | null = null

const EXPORT_DIR_KEY = 'export_dir_uri'

/** 从 SQLite 恢复导出目录缓存 */
function loadSavedExportDir(): Directory | null {
    if (savedExportDir) return savedExportDir
    try {
        const row = db.select().from(settingsTable).where(eq(settingsTable.key, EXPORT_DIR_KEY)).get()
        if (row?.value) {
            return new Directory(row.value)
        }
    } catch {
        // 查询失败或迁移未完成，忽略
    }
    return null
}

/** 持久化导出目录 URI 到 SQLite */
function saveExportDirUri(directory: Directory) {
    db.insert(settingsTable)
        .values({ key: EXPORT_DIR_KEY, value: directory.uri })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: directory.uri } })
        .run()
}

/** 清除缓存的导出目录，下次导出时会重新弹出选择器 */
export function resetSavedExportDir() {
    savedExportDir = null
    db.delete(settingsTable).where(eq(settingsTable.key, EXPORT_DIR_KEY)).run()
}

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
 * 获取缓存的导出目录（可能为 null）
 */
export function getSavedExportDir(): Directory | null {
    return loadSavedExportDir()
}

/**
 * 导出数据为json文件到公共 Downloads 目录
 *
 * Android: 通过 Directory.pickDirectoryAsync 让用户选择目录（选中一次后缓存，后续直接写入）
 * iOS: 回退到 app 私有文档目录
 */
export async function exportJsonFileToDownloads(data: TJsonFileData, filename: string) {
    if (!filename.endsWith('.json')) {
        filename += '.json'
    }

    const content = JSON.stringify(data, null, 2)

    if (Platform.OS === 'android') {
        const nameWithoutExt = filename.replace(/\.json$/, '')

        // 每次导出都弹出选择器，允许用户切换目录
        let dir: Directory | null = null
        try {
            dir = await Directory.pickDirectoryAsync()
        } catch (err) {
            if (err instanceof Error && err.message.includes('file picker was cancelled')) {
                return false
            }
            throw err
        }

        if (!dir) return false

        savedExportDir = dir
        saveExportDirUri(dir)

        // 文件已存在则先删后写
        for (const item of dir.list()) {
            if (item instanceof File && item.name === nameWithoutExt) {
                item.delete()
                break
            }
        }

        const file = dir.createFile(nameWithoutExt, 'application/json')
        file.write(content)

        return true
    }

    // iOS: 回退到 app 私有目录
    return exportJsonFile(data, filename)
}

/**
 * 扫描导出目录中的json文件（Android SAF 目录）
 */
export async function scanExportDirJsonFile(): Promise<{ name: string; size: number }[]> {
    const dir = loadSavedExportDir()
    if (!dir) return []

    const items = dir.list()
    const jsonFiles: { name: string; size: number }[] = []

    for (const item of items) {
        if (item instanceof File) {
            jsonFiles.push({
                name: item.name,
                size: item.size ?? 0,
            })
        }
    }

    return jsonFiles
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
 * 删除json文件（私有目录）
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
 * 批量删除json文件（私有目录）
 */
export async function deleteJsonFileList(fileNameList: string[]) {
    return await Promise.all(fileNameList.map(deleteJsonFile))
}

/**
 * 删除导出目录中的文件
 */
export async function deleteExportDirJsonFile(fileName: string): Promise<boolean> {
    const dir = loadSavedExportDir()
    if (!dir) return false

    const nameWithoutExt = fileName.replace(/\.json$/, '')
    for (const item of dir.list()) {
        if (item instanceof File && (item.name === fileName || item.name === nameWithoutExt)) {
            item.delete()
            return true
        }
    }
    return false
}

/**
 * 批量删除导出目录中的文件
 */
export async function deleteExportDirJsonFileList(fileNameList: string[]) {
    return await Promise.all(fileNameList.map(deleteExportDirJsonFile))
}
