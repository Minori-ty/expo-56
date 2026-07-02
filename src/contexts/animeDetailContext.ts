import { createContext, useContext } from 'react'

/**
 * animeDetail 页面共享数据：totalEpisode + firstEpisode/lastEpisode 时间戳。
 * 供 Day 单元格渲染用（避免层层 props 透传）。
 */
export interface IAnimeDetailContext {
    firstEpisodeTimestamp: number
    lastEpisodeTimestamp: number
    totalEpisode: number
}

export const animeDetailContext = createContext<IAnimeDetailContext | null>(null)

export const useAnimeDetailContext = () => {
    const ctx = useContext(animeDetailContext)
    if (!ctx) throw new Error('缺少 animeDetailContext.Provider')
    return ctx
}
