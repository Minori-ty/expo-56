import { useSelector } from '@tanstack/react-store'

import { fieldRegistry, type FieldName } from './fieldRegistry'
import type { AnimeFormApi } from './fields/types'
import { statusFieldMap } from './statusConfig'

/**
 * 通用渲染器：status → fieldNames → registry → Field Component。
 *
 * 通过 useStore 订阅 status，仅 status 变化时重算字段列表；各 Field 组件内部
 * 自行订阅自身依赖的字段，互不干扰。Renderer 本身不含任何业务判断。
 */
export function FormRenderer({ form }: { form: AnimeFormApi }) {
    const status = useSelector(form.store, (s) => s.values.status)
    const fieldNames: FieldName[] = statusFieldMap[status]
    return (
        <>
            {fieldNames.map((fieldName) => {
                const { component: FieldComp, label } = fieldRegistry[fieldName]
                return <FieldComp key={fieldName} form={form} label={label} />
            })}
        </>
    )
}
