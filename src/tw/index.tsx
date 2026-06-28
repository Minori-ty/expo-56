import { Link as RouterLink } from 'expo-router'
import React from 'react'
import {
    View as RNView,
    Text as RNText,
    Pressable as RNPressable,
    ScrollView as RNScrollView,
    TouchableHighlight as RNTouchableHighlight,
    TouchableOpacity as RNTouchableOpacity,
    TextInput as RNTextInput,
    FlatList as RNFlatList,
    Button as RNButton,
    RefreshControl as RNRefreshControl,
    StyleSheet,
} from 'react-native'
import { useCssElement, useNativeVariable as useFunctionalVariable } from 'react-native-css'
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated from 'react-native-reanimated'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'

// CSS Variable hook — on web returns the CSS variable reference directly
export const useCSSVariable =
    process.env.EXPO_OS !== 'web' ? useFunctionalVariable : (variable: string) => `var(${variable})`

// ─── Link ───────────────────────────────────────────────────────────────────

export const Link = (props: React.ComponentProps<typeof RouterLink> & { className?: string }) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RouterLink, props, { className: 'style' })
}

Link.Trigger = RouterLink.Trigger
Link.Menu = RouterLink.Menu
Link.MenuAction = RouterLink.MenuAction
Link.Preview = RouterLink.Preview

// ─── View ───────────────────────────────────────────────────────────────────

export type ViewProps = React.ComponentProps<typeof RNView> & {
    className?: string
}

export const View = (props: ViewProps) => {
    return useCssElement(RNView, props, { className: 'style' })
}
View.displayName = 'CSS(View)'

// ─── Text ───────────────────────────────────────────────────────────────────

export const Text = (props: React.ComponentProps<typeof RNText> & { className?: string }) => {
    return useCssElement(RNText, props, { className: 'style' })
}
Text.displayName = 'CSS(Text)'

// ─── ScrollView ─────────────────────────────────────────────────────────────

export const ScrollView = (
    props: React.ComponentProps<typeof RNScrollView> & {
        className?: string
        contentContainerClassName?: string
    },
) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNScrollView, props, {
        className: 'style',
        contentContainerClassName: 'contentContainerStyle',
    })
}
ScrollView.displayName = 'CSS(ScrollView)'

// ─── Pressable ──────────────────────────────────────────────────────────────

export const Pressable = (props: React.ComponentProps<typeof RNPressable> & { className?: string }) => {
    return useCssElement(RNPressable, props, { className: 'style' })
}
Pressable.displayName = 'CSS(Pressable)'

// ─── TextInput ──────────────────────────────────────────────────────────────

export const TextInput = (props: React.ComponentProps<typeof RNTextInput> & { className?: string }) => {
    return useCssElement(RNTextInput, props, { className: 'style' })
}
TextInput.displayName = 'CSS(TextInput)'

// ─── AnimatedScrollView ─────────────────────────────────────────────────────

export const AnimatedScrollView = (
    props: React.ComponentProps<typeof Animated.ScrollView> & {
        className?: string
        contentClassName?: string
        contentContainerClassName?: string
    },
) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(Animated.ScrollView, props, {
        className: 'style',
        contentClassName: 'contentContainerStyle',
        contentContainerClassName: 'contentContainerStyle',
    })
}

// ─── TouchableHighlight ─────────────────────────────────────────────────────

function XXTouchableHighlight(props: React.ComponentProps<typeof RNTouchableHighlight>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { underlayColor, ...style } = (StyleSheet.flatten(props.style) || {}) as { underlayColor?: string }
    return <RNTouchableHighlight underlayColor={underlayColor} {...props} style={style} />
}

export const TouchableHighlight = (props: React.ComponentProps<typeof RNTouchableHighlight>) => {
    return useCssElement(XXTouchableHighlight, props, { className: 'style' })
}
TouchableHighlight.displayName = 'CSS(TouchableHighlight)'

// ─── TouchableOpacity ────────────────────────────────────────────────────────

export const TouchableOpacity = (props: React.ComponentProps<typeof RNTouchableOpacity> & { className?: string }) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNTouchableOpacity, props, { className: 'style' })
}
TouchableOpacity.displayName = 'CSS(TouchableOpacity)'

// ─── FlatList ────────────────────────────────────────────────────────────────

export const FlatList = <T,>(
    props: React.ComponentProps<typeof RNFlatList<T>> & {
        className?: string
        contentContainerClassName?: string
    },
) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNFlatList<T>, props, {
        className: 'style',
        contentContainerClassName: 'contentContainerStyle',
    })
}
FlatList.displayName = 'CSS(FlatList)'

// ─── Button ──────────────────────────────────────────────────────────────────

export const Button = (props: React.ComponentProps<typeof RNButton> & { className?: string }) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNButton, props, { className: 'style' })
}
Button.displayName = 'CSS(Button)'

// ─── SafeAreaView ────────────────────────────────────────────────────────────

export const SafeAreaView = (props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string }) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNSafeAreaView, props, { className: 'style' })
}
SafeAreaView.displayName = 'CSS(SafeAreaView)'

// ─── RefreshControl ──────────────────────────────────────────────────────────

export const RefreshControl = (props: React.ComponentProps<typeof RNRefreshControl> & { className?: string }) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNRefreshControl, props, { className: 'style' })
}
RefreshControl.displayName = 'CSS(RefreshControl)'

// ─── KeyboardAwareScrollView ─────────────────────────────────────────────────

export const KeyboardAwareScrollView = (
    props: React.ComponentProps<typeof RNKeyboardAwareScrollView> & {
        className?: string
        contentContainerClassName?: string
    },
) => {
    // @ts-expect-error: Complex union type from useCssElement
    return useCssElement(RNKeyboardAwareScrollView, props, {
        className: 'style',
        contentContainerClassName: 'contentContainerStyle',
    })
}
KeyboardAwareScrollView.displayName = 'CSS(KeyboardAwareScrollView)'
