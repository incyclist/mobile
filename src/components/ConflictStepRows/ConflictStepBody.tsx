import React, { useCallback, useRef, useState } from 'react'
import {
    View, Text, ScrollView, StyleSheet, useWindowDimensions,
    LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native'

import { colors, textSizes } from '../../theme'
import { ConflictStepRows } from './ConflictStepRows'
import { ConflictRowsLayout, ConflictStepBodyProps } from './types'
import { hasMoreBelow, ScrollSizes } from './utils'

const MORE_BELOW = 'More below ▾'

/**
 * The body of a conflict dialog, under its title: the subline, and the rows in a scroll view of
 * their own, so the subline stays in view. While rows are hidden below, a hint at the bottom says
 * so. A phone's rows use the label-column layout; a tablet falls back to side-by-side (landscape)
 * or stacked (portrait). Both the device list's second step and the dialog for a device found by
 * the search show it, so the two look and read the same; the dialog using it must not scroll its
 * own content (`scrollable={false}`).
 */
export const ConflictStepBody = ({ step, compact, onChoice }: ConflictStepBodyProps) => {
    const { width, height } = useWindowDimensions()
    // a phone's rows always use the label column - it's the layout the scroll-drag area needs,
    // regardless of orientation; a tablet falls back to the existing side-by-side/stacked choice
    const tabletLayout: ConflictRowsLayout = width > height ? 'side-by-side' : 'stacked'
    const layout: ConflictRowsLayout = compact ? 'label-column' : tabletLayout

    const refSizes = useRef<ScrollSizes>({ viewHeight: 0, contentHeight: 0, offset: 0 })
    const [moreBelow, setMoreBelow] = useState<boolean>(false)

    const update = useCallback((changed: Partial<ScrollSizes>) => {
        refSizes.current = { ...refSizes.current, ...changed }
        setMoreBelow(hasMoreBelow(refSizes.current))
    }, [])

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        update({ viewHeight: e.nativeEvent.layout.height })
    }, [update])

    const onContentSizeChange = useCallback((_width: number, contentHeight: number) => {
        update({ contentHeight })
    }, [update])

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        update({ offset: e.nativeEvent.contentOffset.y })
    }, [update])

    return (
        <View style={styles.body}>
            <Text style={styles.subline}>{compact ? step.subline.short : step.subline.full}</Text>
            <View style={styles.rowsArea}>
                <ScrollView
                    style={styles.rows}
                    onLayout={onLayout}
                    onContentSizeChange={onContentSizeChange}
                    onScroll={onScroll}
                    scrollEventThrottle={32}
                    persistentScrollbar
                    bounces={false}
                >
                    <ConflictStepRows rows={step.rows} onChoice={onChoice} layout={layout} />
                </ScrollView>
                {moreBelow ? (
                    <View testID="conflict-more-below" style={styles.moreBelow}>
                        <Text style={styles.moreBelowText}>{MORE_BELOW}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        paddingHorizontal: 8,
        paddingTop: 4,
    },
    subline: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginBottom: 8,
    },
    rowsArea: {
        flex: 1,
        minHeight: 0,
    },
    rows: {
        flex: 1,
    },
    moreBelow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingVertical: 3,
        backgroundColor: colors.dialogBackground.at(-1),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.buttonPrimary,
        // a hint only: taps go to the row under it
        pointerEvents: 'none',
    },
    moreBelowText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.smallText,
        fontWeight: '700',
    },
})
