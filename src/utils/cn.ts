import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并tailwindcss样式
 * @param inputs 样式
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
