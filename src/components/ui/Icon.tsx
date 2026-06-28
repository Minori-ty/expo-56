import {
    ArrowLeft,
    Bell,
    BellOff,
    CalendarCheck,
    CalendarClock,
    Check,
    Clock,
    Heart,
    Hourglass,
    Pencil,
    Plus,
    Search,
    Settings,
    Settings2,
} from 'lucide-react-native'
import { memo } from 'react'
import type { ColorValue } from 'react-native'

type IconName = keyof typeof iconMap
type IconProps = { name: IconName; className?: string; size?: number; color?: ColorValue }

const iconMap = {
    Heart,
    CalendarClock,
    Settings,
    BellOff,
    Bell,
    CalendarCheck,
    Clock,
    Hourglass,
    Search,
    Plus,
    Settings2,
    ArrowLeft,
    Check,
    Pencil,
} as const

const Icon: React.FC<IconProps> = memo(({ name, className, size = 26, color }) => {
    const CustomIcon = iconMap[name]

    return <CustomIcon className={className} size={size} color={color} />
})

export default Icon
Icon.displayName = 'Icon'
