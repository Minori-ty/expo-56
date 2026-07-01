import { TextInput } from 'react-native'

import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { fieldSchemas } from '../schema'
import { textInputBaseClass, textInputErrorClass } from './shared'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function NameField({ form, label }: FieldProps) {
    return (
        <form.Field name="name" validators={{ onChange: fieldSchemas.name }}>
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <TextInput
                            className={cn(textInputBaseClass, error && textInputErrorClass)}
                            placeholder="请输入番剧名称"
                            onChangeText={field.handleChange}
                            onBlur={field.handleBlur}
                            value={field.state.value}
                        />
                    </FormItem>
                )
            }}
        </form.Field>
    )
}
