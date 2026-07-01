/**
 * 文本输入框公共样式（名称/封面/集数等字段共用）。
 * error 时叠加红色边框 —— 由调用处用 cn(...) 合并。
 */
export const textInputBaseClass =
    'h-10 rounded-md border border-[#ccc] p-0 pt-1 pl-2 text-start text-base leading-7'

export const textInputErrorClass = 'border-red-500'

/**
 * 去除数字字符串的前导零。
 *
 * - 全零（"0"、"00"…）返回 "0"
 * - 否则去掉开头的所有 0
 *
 * 供集数类数字输入字段在 onChangeText 中规范化用户输入。
 */
export function removeLeadingZeros(str: string): string {
    if (/^0+$/.test(str)) return '0'
    return str.replace(/^0+/, '')
}
