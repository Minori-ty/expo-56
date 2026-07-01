import { TextInput } from 'react-native'

import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { fieldSchemas } from '../schema'
import { removeLeadingZeros, textInputBaseClass, textInputErrorClass } from './shared'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function TotalEpisodeField({ form, label }: FieldProps) {
    return (
        <form.Field name="totalEpisode" validators={{ onChange: fieldSchemas.totalEpisode }}>
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <TextInput
                            className={cn(textInputBaseClass, error && textInputErrorClass)}
                            placeholder="请输入总集数"
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
