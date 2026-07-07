import { BottomSheetModal, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { StyleSheet } from 'react-native'
import DateTimePicker, { type DateType, useDefaultStyles } from 'react-native-ui-datepicker'

interface IDatepickerProps {
    date: DateType
    hideHeader?: boolean
    onChange: (date: DateType) => void
    onClose?: () => void
}

export interface IDatePickerRef {
    open: () => void
    close: () => void
}

const DatePicker = forwardRef<IDatePickerRef, IDatepickerProps>(
    ({ onChange, date, onClose, hideHeader = false }, ref) => {
        const defaultStyles = useDefaultStyles()
        const bottomSheetModalRef = useRef<BottomSheetModal>(null)

        const handlePresentModalPress = useCallback(() => {
            bottomSheetModalRef.current?.present()
        }, [])

        const handleClose = useCallback(() => {
            bottomSheetModalRef.current?.close()
        }, [])

        useImperativeHandle(ref, () => ({
            open: handlePresentModalPress,
            close: handleClose,
        }))

        return (
            <BottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose onClose={onClose}>
                <BottomSheetView style={styles.contentContainer}>
                    <DateTimePicker
                        styles={{
                            ...defaultStyles,
                            time_selected_indicator: { backgroundColor: 'transparent' },
                            today: { backgroundColor: '#B9D5F7' },
                            today_label: { color: '#000' },
                        }}
                        mode="single"
                        date={date}
                        onChange={(params) => onChange(params.date)}
                        firstDayOfWeek={6}
                        multiRangeMode
                        showOutsideDays
                        timePicker
                        locale="zh"
                        hideHeader={hideHeader}
                        initialView={hideHeader ? 'time' : 'day'}
                    />
                </BottomSheetView>
            </BottomSheetModal>
        )
    },
)

DatePicker.displayName = 'DatePicker'

const styles = StyleSheet.create({
    contentContainer: {
        paddingHorizontal: 30,
        height: 400,
    },
})

export default DatePicker
