import { TextInput } from 'react-native'

import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { fieldSchemas } from '../schema'
import { textInputBaseClass, textInputErrorClass } from './shared'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function CoverField({ form, label }: FieldProps) {
    return (
        <form.Field name="cover" validators={{ onChange: fieldSchemas.cover }}>
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <TextInput
                            className={cn(textInputBaseClass, error && textInputErrorClass)}
                            placeholder="请输入封面图片URL"
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
