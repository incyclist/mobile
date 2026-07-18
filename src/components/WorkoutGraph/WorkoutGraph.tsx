import React, { useCallback, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { WorkoutGraphView } from './WorkoutGraphView';
import type { WorkoutGraphProps } from './types';

/**
 * Smart wrapper for WorkoutGraph. Measures its own width (and height, unless a
 * fixed `height` is supplied — e.g. thumbnail rows in `strip` mode) via
 * onLayout, then hands concrete pixel dimensions to the pure WorkoutGraphView.
 * Same measure-then-render pattern as ActivityGraph.
 *
 * Consumers that already know their pixel box (list rows, Storybook) can use
 * WorkoutGraphView directly; this wrapper exists for flex-sized containers such
 * as the details dialog and the (future) ride screen.
 */
export const WorkoutGraph = ({
    mode,
    plan,
    actuals,
    showAxes,
    showFtpLine,
    height,
    style,
}: WorkoutGraphProps) => {
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height: h } = e.nativeEvent.layout;
        setLayout(prev =>
            prev.width === width && prev.height === h ? prev : { width, height: h }
        );
    }, []);

    const resolvedHeight = height ?? layout.height;
    const containerStyle = height !== undefined ? [styles.fixed, { height }, style] : [styles.flex, style];

    return (
        <View style={containerStyle} onLayout={onLayout}>
            {layout.width > 0 && resolvedHeight > 0 && (
                <WorkoutGraphView
                    width={layout.width}
                    height={resolvedHeight}
                    mode={mode}
                    plan={plan}
                    actuals={actuals}
                    showAxes={showAxes}
                    showFtpLine={showFtpLine}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    fixed: {
        width: '100%',
    },
});
