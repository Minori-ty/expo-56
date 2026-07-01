import { TextInput } from 'react-native'

import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { fieldSchemas } from '../schema'
import { removeLeadingZeros, textInputBaseClass, textInputErrorClass } from './shared'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function CurrentEpisodeField({ form, label }: FieldProps) {
    return (
        <form.Field name="currentEpisode" validators={{ onChange: fieldSchemas.currentEpisode }}>
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <TextInput
                            className={cn(textInputBaseClass, error && textInputErrorClass)}
                            placeholder="请输入当前更新集数"
                            onChangeText={(text) => {
                                field.handleChange(Number(removeLeadingZeros(text.replace(/[^0-9]/g, ''))))
                            }}
                            onBlur={field.handleBlur}
                            keyboardType="numeric"
                            value={field.state.value?.toString() || ''}
                        />
                    </FormItem>
                )
            }}
        </form.Field>
    )
}
