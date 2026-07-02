import { useMutation, useQuery } from '@tanstack/react-query'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useNavigation } from 'expo-router'
import { Calendar, Download, FileText, Trash2, Upload } from 'lucide-react-native'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { BackHandler } from 'react-native'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'

import { deleteCalendarByAnimeId, deleteCalendarByAnimeIds } from '@/api/calendar'
import { exportAnimeToJsonFile, importAnimeFromJsonFile } from '@/api/data-management'
import Checkbox from '@/components/Checkbox'
import { useModal } from '@/components/Modal'
import TransparentLoading from '@/components/TransparentLoading'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { themeColorPurple } from '@/styles'
import {
    deleteExportDirJsonFile,
    deleteExportDirJsonFileList,
    getSavedExportDir,
    scanExportDirJsonFile,
} from '@/utils/file'
import { queryClient } from '@/utils/react-query'

type CheckboxState = 'unchecked' | 'checked' | 'indeterminate'

/** 字节数格式化（B / KB / MB） */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DataManagement() {
    const modal = useModal()
    const [selectedAnimeIdList, setSelectedAnimeIdList] = useState<number[]>([])
    const [selectedJsonFileList, setSelectedJsonFileList] = useState<string[]>([])

    const { data, updatedAt } = useLiveQuery(db.select().from(animeTable))

    type TData = (typeof data)[number]
    type TEventIds = TData & { eventIds: NonNullable<TData['eventIds']> }

    const hasEventIds = useCallback((item: TData): item is TEventIds => {
        return item.eventIds !== null && item.eventIds.length > 0
    }, [])

    const calendarList = useMemo(() => {
        return data.filter(hasEventIds)
    }, [data, hasEventIds])

    const isLoading = useMemo(() => {
        return !updatedAt
    }, [updatedAt])

    const { data: fileList = [] } = useQuery({
        queryKey: ['settings-json-file'],
        queryFn: scanExportDirJsonFile,
    })

    useEffect(() => {
        const allId = calendarList.map((item) => item.id)
        setSelectedAnimeIdList((prev) => prev.filter((id) => allId.includes(id)))
    }, [calendarList])

    useEffect(() => {
        const allFile = fileList.map((item) => item.name)
        setSelectedJsonFileList((prev) => prev.filter((fileName) => allFile.includes(fileName)))
    }, [fileList])

    const { mutate: handleClearCalendarByAnimeIdMution, isPending: isSingleDeleting } = useMutation({
        mutationFn: deleteCalendarByAnimeId,
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({
                queryKey: ['anime-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            // 不可变更新：不要直接 splice state 数组，否则会破坏 React 引用相等语义。
            setSelectedAnimeIdList((prev) => prev.filter((x) => x !== id))
        },
        onError: (err) => {
            Toast.show({
                type: 'error',
                text1: `获取日历事件失败 ${err instanceof Error ? err.message : String(err)}`,
            })
        },
    })

    const handleUnsubscribe = useCallback(
        (id: number) => {
            if (isSingleDeleting) return
            handleClearCalendarByAnimeIdMution(id)
        },
        [handleClearCalendarByAnimeIdMution, isSingleDeleting],
    )

    const { mutate: handleCalendarByAnimeIdListMution, isPending: isBatchDeleting } = useMutation({
        mutationFn: deleteCalendarByAnimeIds,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['anime-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            setSelectedAnimeIdList([])
        },
    })

    const handleUnsubscribeAll = useCallback(() => {
        if (isBatchDeleting) return
        handleCalendarByAnimeIdListMution(selectedAnimeIdList)
    }, [handleCalendarByAnimeIdListMution, selectedAnimeIdList, isBatchDeleting])

    const isDeletingCalendarEvent = isSingleDeleting || isBatchDeleting

    // 删除日历事件时禁止安卓返回键
    useEffect(() => {
        if (!isDeletingCalendarEvent) return
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true)
        return () => subscription.remove()
    }, [isDeletingCalendarEvent])

    const handleEventSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedAnimeIdList(calendarList.map((item) => item.id))
        } else {
            setSelectedAnimeIdList([])
        }
    }

    const eventSelectAllState: CheckboxState =
        selectedAnimeIdList.length === 0
            ? 'unchecked'
            : selectedAnimeIdList.length === calendarList.length
              ? 'checked'
              : 'indeterminate'

    const handleEventSelect = (animeId: number, checked: boolean) => {
        if (checked) {
            setSelectedAnimeIdList((prev) => [...prev, animeId])
        } else {
            setSelectedAnimeIdList((prev) => prev.filter((id) => id !== animeId))
        }
    }

    const { mutate: exportDataToJsonFileMutation, isPending: isExportDataToJsonFileMutationLoading } = useMutation({
        mutationFn: exportAnimeToJsonFile,
        onSuccess: (date) => {
            if (!date) return
            queryClient.invalidateQueries({
                queryKey: ['settings-json-file'],
            })

            Toast.show({
                type: 'success',
                text1: '导出成功！',
            })
        },
        onError: (err) => {
            console.log(err)

            Toast.show({
                type: 'error',
                text1: `导出失败！${err instanceof Error ? err.message : String(err)}`,
            })
        },
    })

    const { mutate: handleImportJsonFileToDataMution, isPending: handleImportJsonFileToDataMutionLoading } =
        useMutation({
            mutationFn: async () => {
                const result = await importAnimeFromJsonFile()
                if (!result.ok) {
                    Toast.show({ type: 'error', text1: 'json数据校验失败，不符合格式' })
                }
                return result
            },
            onSuccess: (result) => {
                if (!result.ok) return
                queryClient.invalidateQueries({
                    queryKey: ['schedule'],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
                Toast.show({
                    type: 'success',
                    text1: '导入成功！',
                })
            },
        })

    const { mutate: deleteJsonFileMution } = useMutation({
        mutationFn: deleteExportDirJsonFile,
        onSuccess: (_, fileName) => {
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-json-file'],
            })

            // 不可变更新
            setSelectedJsonFileList((prev) => prev.filter((x) => x !== fileName))
        },
        onError: (err) => {
            Toast.show({
                type: 'error',
                text1: err instanceof Error ? err.message : String(err),
            })
        },
    })

    const { mutate: deleteJsonFileListMution } = useMutation({
        mutationFn: deleteExportDirJsonFileList,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-json-file'],
            })
            setSelectedJsonFileList([])
            modal.hide()
        },
        onError: (err) => {
            Toast.show({
                type: 'error',
                text1: err instanceof Error ? err.message : String(err),
            })
        },
    })

    const handleFileSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedJsonFileList(fileList.map((file) => file.name))
        } else {
            setSelectedJsonFileList([])
        }
    }
    const fileSelectAllState: CheckboxState =
        selectedJsonFileList.length === 0
            ? 'unchecked'
            : selectedJsonFileList.length === fileList.length
              ? 'checked'
              : 'indeterminate'

    const handleFileSelect = (fileName: string, checked: boolean) => {
        if (checked) {
            setSelectedJsonFileList((prev) => [...prev, fileName])
        } else {
            setSelectedJsonFileList((prev) => prev.filter((name) => name !== fileName))
        }
    }

    function refetch() {
        queryClient.invalidateQueries({
            queryKey: ['settings-json-file'],
        })
    }

    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '数据管理',
        })
    }, [navigation])

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        className="text-theme"
                        colors={[themeColorPurple]}
                    />
                }
            >
                <View className="p-4">
                    {/* 数据管理区域 */}
                    <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <Text className="mb-4 text-lg font-semibold text-gray-900">数据管理</Text>

                        <View className="mb-4 flex-row gap-3">
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                                    isExportDataToJsonFileMutationLoading ? 'bg-gray-300' : 'bg-blue-600'
                                }`}
                                onPress={() => {
                                    exportDataToJsonFileMutation()
                                }}
                                disabled={isExportDataToJsonFileMutationLoading}
                                activeOpacity={0.7}
                            >
                                <Download size={16} color="white" />
                                <Text className="ml-2 font-medium text-white">
                                    {isExportDataToJsonFileMutationLoading ? '导出中...' : '导出数据'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                                    handleImportJsonFileToDataMutionLoading ? 'bg-gray-300' : 'bg-green-600'
                                }`}
                                onPress={() => handleImportJsonFileToDataMution()}
                                disabled={handleImportJsonFileToDataMutionLoading}
                                activeOpacity={0.7}
                            >
                                <Upload size={16} color="white" />
                                <Text className="ml-2 font-medium text-white">
                                    {handleImportJsonFileToDataMutionLoading ? '导入中...' : '导入数据'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 本地文件管理 */}
                    <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <View className="mb-4 h-10 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <FileText size={20} color="#374151" />
                                <Text className="ml-2 text-lg font-semibold text-gray-900">本地文件</Text>
                            </View>
                            {selectedJsonFileList.length > 0 && (
                                <TouchableOpacity
                                    className="flex-row items-center rounded-lg bg-red-100 px-3 py-2"
                                    onPress={() => {
                                        modal.show({
                                            body: (
                                                <Text className="text-sm">
                                                    你确定要删除{selectedJsonFileList.length}个文件吗
                                                </Text>
                                            ),
                                            onConfirm: () => deleteJsonFileListMution(selectedJsonFileList),
                                        })
                                    }}
                                >
                                    <Trash2 size={14} color="#dc2626" />
                                    <Text className="ml-1 text-sm font-medium text-red-600">
                                        删除 ({selectedJsonFileList.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {fileList.length > 0 && (
                            <View className="mb-3">
                                <Checkbox
                                    label="全选"
                                    allowIndeterminate
                                    state={fileSelectAllState}
                                    onStateChange={handleFileSelectAll}
                                />
                            </View>
                        )}

                        {fileList.length === 0 ? (
                            <Text className="py-8 text-center text-gray-500">暂无本地文件</Text>
                        ) : (
                            <View className="space-y-3">
                                {fileList.map((file) => (
                                    <View key={file.name} className="flex-row rounded-lg bg-gray-50 p-3">
                                        <Checkbox
                                            state={selectedJsonFileList.includes(file.name) ? 'checked' : 'unchecked'}
                                            onStateChange={(state) => handleFileSelect(file.name, state === 'checked')}
                                        />
                                        <View className="ml-3 flex-1">
                                            <Text className="font-medium text-gray-900">{file.name}</Text>
                                            <View className="mt-1 flex-row items-center">
                                                <Text className="text-sm text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </Text>
                                                <Text className="mx-2 text-sm text-gray-400">•</Text>
                                            </View>
                                            <View>
                                                <Text className="text-xs text-gray-500" numberOfLines={1}>
                                                    路径：{getSavedExportDir()?.uri ?? ''}
                                                </Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            className="mt-1"
                                            onPress={() => {
                                                modal.show({
                                                    body: (
                                                        <Text className="text-sm">
                                                            你确定要删除文件 {file.name} 吗？
                                                        </Text>
                                                    ),
                                                    onConfirm: () => deleteJsonFileMution(file.name),
                                                })
                                            }}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* 日历事件管理 */}
                    <View className="rounded-lg bg-white p-4 shadow-sm">
                        <View className="mb-4 h-10 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Calendar size={20} color="#374151" />
                                <Text className="ml-2 text-lg font-semibold text-gray-900">动漫日历事件</Text>
                            </View>
                            {selectedAnimeIdList.length > 0 && (
                                <TouchableOpacity
                                    className="flex-row items-center rounded-lg bg-red-100 px-3 py-2"
                                    onPress={() => {
                                        modal.show({
                                            body: (
                                                <Text className="text-sm">
                                                    你确定要删除{selectedAnimeIdList.length}个动漫日历事件吗？
                                                </Text>
                                            ),
                                            onConfirm: handleUnsubscribeAll,
                                        })
                                    }}
                                    disabled={isBatchDeleting}
                                >
                                    <Trash2 size={14} color="#dc2626" />
                                    <Text className="ml-1 text-sm font-medium text-red-600">
                                        删除 ({selectedAnimeIdList.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {calendarList.length > 0 && (
                            <View className="mb-3">
                                <Checkbox
                                    label="全选"
                                    allowIndeterminate
                                    state={eventSelectAllState}
                                    onStateChange={handleEventSelectAll}
                                />
                            </View>
                        )}

                        {calendarList.length === 0 ? (
                            <Text className="py-8 text-center text-gray-500">暂无日历事件</Text>
                        ) : (
                            <View className="space-y-3">
                                {calendarList.map((item) => {
                                    return (
                                        <View
                                            key={item.id}
                                            className="mb-2 flex-row items-center justify-between rounded-lg bg-gray-50 p-3"
                                        >
                                            <Checkbox
                                                state={selectedAnimeIdList.includes(item.id) ? 'checked' : 'unchecked'}
                                                onStateChange={(state) =>
                                                    handleEventSelect(item.id, state === 'checked')
                                                }
                                                label={item.name}
                                            />
                                            <TouchableOpacity
                                                onPress={() => {
                                                    modal.show({
                                                        body: (
                                                            <Text className="text-sm">
                                                                确定要删除事件 {item.name} 吗？
                                                            </Text>
                                                        ),
                                                        onConfirm: () => handleUnsubscribe(item.id),
                                                    })
                                                }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )
                                })}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            {isDeletingCalendarEvent ? (
                <View className="absolute inset-0 z-50 bg-white/70">
                    <TransparentLoading />
                </View>
            ) : null}
        </>
    )
}
