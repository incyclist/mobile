import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
// Removed: import { ActivityDetailsUI } from 'incyclist-services';
import {
    ActivityMetric,
    XAxisMode,
    ActivityGraphProps,
    ActivityGraphSeries
} from './types';
import {
    getAvailableMetrics,
    computeActivitySeries,
    computeElevationPoints
} from './utils';
import { ActivityGraphView } from './ActivityGraphView';
import { ChipSelect } from '../ChipSelect/ChipSelect';
// Removed: useUnmountEffect since toast functionality is removed
import { useScreenLayout } from '../../hooks/render';
import { colors, textSizes } from '../../theme';

export const ActivityGraph = ({
    activity,
    ftp,
    style,
    showXAxis = true,
    showYAxis = true,
    axisFontSize: propsAxisFontSize,
    units,
}: ActivityGraphProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const [xMode, setXMode] = useState<XAxisMode>('distance');
    const [activeMetric, setActiveMetric] = useState<ActivityMetric | undefined>(undefined);
    // Removed: Toast related state and ref
    // const [showToast, setShowToast] = useState(false);
    // const refToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [controlsHeight, setControlsHeight] = useState(0);

    const axisFontSize = propsAxisFontSize ?? (isCompact ? 9 : 11);

    const availableMetrics = useMemo(() =>
        getAvailableMetrics(activity?.logs ?? []),
    [activity?.logs]);

    useEffect(() => {
        if (availableMetrics.length === 0) {
            setActiveMetric(undefined);
            return;
        }

        if (availableMetrics.includes('power')) {
            setActiveMetric('power');
        } else {
            setActiveMetric(availableMetrics[0]);
        }
    }, [availableMetrics]);

    // Removed: Toast related functions and useEffect cleanup
    // const triggerToast = useCallback(() => { ... }, []);
    // useUnmountEffect(() => { ... });

    const onMetricChange = useCallback((metric: string) => {
        setActiveMetric(metric as ActivityMetric);
    }, []);

    const onContainerLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    };

    const onControlsLayout = (event: LayoutChangeEvent) => {
        setControlsHeight(event.nativeEvent.layout.height);
    };

    const series: ActivityGraphSeries[] = useMemo(() => {
        if (dimensions.width <= 0 || !activeMetric) return [];

        const computed = computeActivitySeries(
            activity?.logs ?? [],
            [activeMetric],
            xMode,
            dimensions.width,
            ftp,
            units
        );

        // With single select, sorting is less critical as only one series is ever present
        // but keeping for consistency with previous logic if multi-select is re-introduced.
        return computed.sort((a, b) => {
            if (a.metric === 'power') return -1;
            if (b.metric === 'power') return 1;
            return 0;
        });
    }, [activity, activeMetric, xMode, dimensions.width, ftp, units]);

    const elevationPoints = useMemo(() =>
        computeElevationPoints(activity?.logs ?? [], xMode, dimensions.width),
    [activity, xMode, dimensions.width]);

    const elevationYRange = useMemo(() => {
        if (!elevationPoints || elevationPoints.length === 0) return { min: 0, max: 0 };
        const vals = elevationPoints.map(p => p.y);
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [elevationPoints]);

    const xRange = useMemo(() => {
        if (series.length === 0) return { min: 0, max: 0 };
        const allX = series.flatMap(s => s.points.map(p => p.x));
        return { min: Math.min(...allX), max: Math.max(...allX) };
    }, [series]);

    if (!activity) return null;

    const graphHeight = dimensions.height - controlsHeight;

    return (
        <View style={[styles.container, style]} onLayout={onContainerLayout}>
            <View style={styles.controls} onLayout={onControlsLayout}>
                <ChipSelect
                    label=""
                    options={['distance', 'time']} // Options as raw strings, ChipSelect will display these
                    selected={xMode}
                    onValueChange={(v) => setXMode(v as XAxisMode)}
                    // Removed: multi prop
                    // Removed: optionLabels prop
                />
                <View style={styles.spacer} />
                <ChipSelect
                    label=""
                    options={availableMetrics} // Options as raw strings, ChipSelect will display these
                    selected={activeMetric}
                    onValueChange={onMetricChange}
                    // Removed: multi prop
                    // Removed: optionLabels prop
                />
            </View>

            <View style={{ width: dimensions.width, height: graphHeight }}>
                <ActivityGraphView
                    width={dimensions.width}
                    height={graphHeight}
                    series={series}
                    xMode={xMode}
                    xMin={xRange.min}
                    xMax={xRange.max}
                    elevationPoints={elevationPoints}
                    elevationYMin={elevationYRange.min}
                    elevationYMax={elevationYRange.max}
                    showXAxis={showXAxis}
                    showYAxis={showYAxis}
                    axisFontSize={axisFontSize}
                    units={units}
                />

                {/* Removed: Toast rendering logic */}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
    },
    spacer: {
        width: 16,
    },
    // Removed: Toast styles
    // toastContainer: { ... },
    // toast: { ... },
    // toastText: { ... },
});