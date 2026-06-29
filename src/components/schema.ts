import dayjs from 'dayjs'
import { z, ZodIssueCode } from 'zod'

import { EStatus, EWeekday } from '@/enums'

const dateString = z.preprocess(
    (val) => (val === undefined || val === null ? '' : val),
    z.string().nonempty('请选择日期'),
)

const statusSchema = z.discriminatedUnion('status', [
    z.object({
        status: z.literal(EStatus.serializing),
        updateWeekday: z.union([
            z.literal(EWeekday.monday),
            z.literal(EWeekday.tuesday),
            z.literal(EWeekday.wednesday),
            z.literal(EWeekday.thursday),
            z.literal(EWeekday.friday),
            z.literal(EWeekday.saturday),
            z.literal(EWeekday.sunday),
            z.literal(''),
        ]),
        currentEpisode: z.number(),
        updateTimeHHmm: z.preprocess(
            (val) => (val === undefined || val === null ? '' : val),
            z.string().regex(/(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/, '请输入正确的时间格式HH:mm'),
        ),
    }),
    z.object({
        status: z.literal(EStatus.completed),
        lastEpisodeYYYYMMDDHHmm: dateString,
    }),
    z.object({
        status: z.literal(EStatus.toBeUpdated),
        firstEpisodeYYYYMMDDHHmm: dateString,
    }),
])

const formSchema = z
    .object({
        name: z.string().min(1, '请输入番剧名称').max(20, '番剧名称长度不能超过20个字符'),
        totalEpisode: z.number().min(1, '总集数至少为1'),
        cover: z.string().url('请输入有效的URL'),
    })
    .and(statusSchema)
    .superRefine((val, ctx) => {
        if (val.status === EStatus.serializing) {
            if (val.currentEpisode === 0) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['currentEpisode'],
                    message: '当前集数至少为1',
                })
            }
            if (val.totalEpisode !== 0) {
                if (val.currentEpisode > val.totalEpisode) {
                    ctx.addIssue({
                        code: ZodIssueCode.custom,
                        path: ['currentEpisode'],
                        message: '当前集数不能大于总集数',
                    })
                }
                if (val.currentEpisode === val.totalEpisode) {
                    ctx.addIssue({
                        code: ZodIssueCode.custom,
                        path: ['currentEpisode'],
                        message: '该番剧已完结，请选择已完结状态',
                    })
                }
            }
            if (val.updateWeekday === '') {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['updateWeekday'],
                    message: '请选择其中一项',
                })
            }
        }

        if (val.status === EStatus.completed) {
            const { totalEpisode, lastEpisodeYYYYMMDDHHmm } = val
            const lastEpisodeTimestamp = dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').unix()
            const firstEpisodeTimestamp = dayjs(`${lastEpisodeYYYYMMDDHHmm}`, 'YYYY-MM-DD HH:mm')
                .subtract(totalEpisode - 1, 'week')
                .unix()
            if (lastEpisodeTimestamp > dayjs().unix()) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['lastEpisodeYYYYMMDDHHmm'],
                    message: '当前番剧还未完结，请选择连载中状态',
                })
            }
            if (totalEpisode !== 0) {
                if (lastEpisodeYYYYMMDDHHmm === undefined) {
                    ctx.addIssue({
                        code: ZodIssueCode.custom,
                        path: ['lastEpisodeYYYYMMDDHHmm'],
                        message: '请选择日期',
                    })
                }
                if (firstEpisodeTimestamp > dayjs().unix()) {
                    ctx.addIssue({
                        code: ZodIssueCode.custom,
                        path: ['lastEpisodeYYYYMMDDHHmm'],
                        message: '当前番剧还未播出，请选择即将更新状态',
                    })
                }

                if (lastEpisodeTimestamp > dayjs().unix()) {
                    ctx.addIssue({
                        code: ZodIssueCode.custom,
                        path: ['lastEpisodeYYYYMMDDHHmm'],
                        message: '当前番剧还未完结，请选择连载中状态',
                    })
                }
            }
        }

        if (val.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm, totalEpisode } = val
            const firstEpisodeTimestamp = dayjs(`${firstEpisodeYYYYMMDDHHmm}`).unix()

            if (firstEpisodeTimestamp <= dayjs().unix()) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['firstEpisodeYYYYMMDDHHmm'],
                    message: '当前番剧连载中，请选择连载中状态',
                })
            }

            if (totalEpisode !== 0) {
                if (firstEpisodeYYYYMMDDHHmm === undefined) {
                    ctx.addIssue({
                        code: ZodIssueCode.custom,
                        path: ['firstEpisodeYYYYMMDDHHmm'],
                        message: '请选择日期',
                    })
                }
            }
        }
    })

/**
 * 表单类型 — 手动定义而非使用 z.infer，因 z.preprocess 在 discriminatedUnion
 * 中无法被 TypeScript 正确推断（会得到 unknown）。
 * @see https://github.com/colinhacks/zod/issues/2280
 */
type TFormSchema = {
    name: string
    totalEpisode: number
    cover: string
} & (
    | {
          status: typeof EStatus.serializing
          updateWeekday: typeof EWeekday.valueType | ''
          currentEpisode: number
          updateTimeHHmm: string
      }
    | {
          status: typeof EStatus.completed
          lastEpisodeYYYYMMDDHHmm: string
      }
    | {
          status: typeof EStatus.toBeUpdated
          firstEpisodeYYYYMMDDHHmm: string
      }
)

const formDefaultValues: TFormSchema = {
    name: '',
    updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
    totalEpisode: 0,
    status: EStatus.serializing,
    cover: '',
    currentEpisode: 0,
    updateWeekday: '',
}

type TFormInput = z.input<typeof formSchema>
type TFormOutput = z.output<typeof formSchema>

export { formDefaultValues, formSchema, TFormInput, TFormOutput, TFormSchema }
