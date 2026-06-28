import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
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
            onClose?.()
        }, [onClose])

        useImperativeHandle(ref, () => ({
            open: handlePresentModalPress,
            close: handleClose,
        }))

        return (
            <BottomSheetModal
                ref={bottomSheetModalRef}
                enableContentPanningGesture={false}
                // eslint-disable-next-line react/no-unstable-nested-components
                backdropComponent={() => (
                    <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={handleClose} />
                )}
            >
                <BottomSheetView style={styles.contentContainer}>
                    <DateTimePicker
                        styles={defaultStyles}
                        mode="single"
                        date={date}
                        onChange={params => onChange(params.date)}
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
    }
)

DatePicker.displayName = 'DatePicker'

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        paddingHorizontal: 30,
        height: 400,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
})

export default DatePicker
