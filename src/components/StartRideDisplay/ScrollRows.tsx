import React, { PropsWithChildren, useCallback, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const FADE_HEIGHT = 16;
const FADE_FROM = 'rgba(26,4,86,0)';
const FADE_TO = 'rgba(26,4,86,0.975)';

type Metrics = { viewport: number; content: number; offset: number };

// a few dp of slack: the bounded dialog body can come out a couple of dp short of the rows' natural height,
// which is not worth a fade or a scrollbar flash
const SLACK = 4;

const hasMoreBelow = ({ viewport, content, offset }: Metrics) => viewport > 0 && offset + viewport < content - SLACK;
const overflows = ({ viewport, content }: Metrics) => viewport > 0 && content > viewport + SLACK;

const BottomFade = () => {
    if (Platform.OS === 'web') {
        return (
            <View
                testID="start-rows-fade"
                pointerEvents="none"
                style={[styles.fade, { backgroundImage: `linear-gradient(${FADE_FROM}, ${FADE_TO})` } as object]}
            />
        );
    }
    return <LinearGradient testID="start-rows-fade" pointerEvents="none" colors={[FADE_FROM, FADE_TO]} style={styles.fade} />;
};

/**
 * The rows region: the only part of the start overlay that scrolls. A fade shows while more rows
 * are below, and the scroll indicator is flashed once when the content first overflows.
 */
export const ScrollRows = ({ children }: PropsWithChildren) => {
    const refScroll = useRef<ScrollView>(null);
    const refMetrics = useRef<Metrics>({ viewport: 0, content: 0, offset: 0 });
    const refFlashed = useRef(false);
    const [moreBelow, setMoreBelow] = useState(false);

    const update = useCallback((change: Partial<Metrics>) => {
        refMetrics.current = { ...refMetrics.current, ...change };
        setMoreBelow(hasMoreBelow(refMetrics.current));
        if (!refFlashed.current && overflows(refMetrics.current)) {
            refFlashed.current = true;
            refScroll.current?.flashScrollIndicators?.();
        }
    }, []);

    const onLayout = useCallback((e: LayoutChangeEvent) => update({ viewport: e.nativeEvent.layout.height }), [update]);
    const onContentSizeChange = useCallback((_w: number, h: number) => update({ content: h }), [update]);
    const onScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => update({ offset: e.nativeEvent.contentOffset.y }),
        [update],
    );

    return (
        <View style={styles.region}>
            <ScrollView
                ref={refScroll}
                style={styles.scroll}
                bounces={false}
                persistentScrollbar
                scrollEventThrottle={32}
                testID="start-rows"
                onLayout={onLayout}
                onContentSizeChange={onContentSizeChange}
                onScroll={onScroll}
            >
                {children}
            </ScrollView>
            {moreBelow ? <BottomFade /> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    region: {
        flexShrink: 1,
        minHeight: 44,
    },
    scroll: {
        flexGrow: 0,
    },
    fade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: FADE_HEIGHT,
    },
});
