import { RadioGroup } from '@/components/RadioGroup'
import { EStatus } from '@/enums'

import { FormItem } from '../FormItem'
import type { FieldProps } from './types.d'

const statusOptions = EStatus.toList()

export function StatusField({ form, label }: FieldProps) {
    return (
        <form.Field name="status">
            {(field) => (
                <FormItem label={label}>
                    <RadioGroup
                        options={statusOptions}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                    />
                </FormItem>
            )}
        </form.Field>
    )
}
