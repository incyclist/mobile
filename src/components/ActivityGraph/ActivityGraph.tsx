import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import { 
    ActivityGraphProps, 
    ActivityMetric, 
    XAxisMode,
    ActivityLogRecord
} from './types';
import { ActivityGraphView } from './ActivityGraphView';
import { ChipSelect } from '../ChipSelect/ChipSelect';
import { 
    getAvailableMetrics, 
    computeActivitySeries, 
    computeElevationPoints 
} from './utils';
import { useLogging, useScreenLayout, useUnmountEffect } from '../../hooks';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';

const METRIC_LABELS: Record<string, ActivityMetric> = {
    'Power': 'power',
    'HR': 'heartrate',
    'Speed': 'speed',
    'Cadence': 'cadence',
};

const LABEL_TO_METRIC: Record<ActivityMetric, string> = {
    'power': 'Power',
    'heartrate': 'HR',
    'speed': 'Speed',
    'cadence': 'Cadence',
};

export const ActivityGraph = (props: ActivityGraphProps) => {
    const { activity, ftp, style, units, axisFontSize: propAxisFontSize } = props;
    const { logEvent } = useLogging('ActivityGraph');
    const screenLayout = useScreenLayout();
    const derivedAxisFontSize = screenLayout === 'compact' ? 9 : 11;
    const resolvedAxisFontSize = propAxisFontSize ?? derivedAxisFontSize;

    const [activeMetrics, setActiveMetrics] = useState<ActivityMetric[]>([]);
    const [xMode, setXMode] = useState<XAxisMode>('distance');
    const [toastVisible, setToastVisible] = useState(false);
    
    const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });
    const [topRowHeight, setTopRowHeight] = useState(0);
    const [bottomRowHeight, setBottomRowHeight] = useState(0);

    const refToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial and dynamic metric defaulting
    useEffect(() => {
        if (!activity?.logs || activity.logs.length === 0) {
            setActiveMetrics([]);
            return;
        }
        const available = getAvailableMetrics(activity.logs);
        const defaults: ActivityMetric[] = [];
        
        if (available.includes('power')) defaults.push('power');
        if (defaults.length < 2 && available.includes('heartrate')) {
            defaults.push('heartrate');
        }
        if (defaults.length === 0 && available.length > 0) {
            defaults.push(available[0]);
        }
        setActiveMetrics(defaults);
    }, [activity]);

    useUnmountEffect(() => {
        if (refToastTimer.current) clearTimeout(refToastTimer.current);
    });

    const availableMetrics = useMemo(() => {
        return activity?.logs ? getAvailableMetrics(activity.logs) : [];
    }, [activity]);

    const metricOptions = useMemo(() => {
        return availableMetrics.map(m => LABEL_TO_METRIC[m]);
    }, [availableMetrics]);

    const handleMetricChange = useCallback((selectedLabels: string[]) => {
        if (selectedLabels.length > 2) {
            setToastVisible(true);
            if (refToastTimer.current) clearTimeout(refToastTimer.current);
            refToastTimer.current = setTimeout(() => setToastVisible(false), 2000);
            return;
        }
        const metrics = selectedLabels.map(l => METRIC_LABELS[l]);
        setActiveMetrics(metrics);
        logEvent({ message: 'metrics changed', metrics });
    }, [logEvent]);

    const handleXModeChange = useCallback((value: string) => {
        const mode = value.toLowerCase() as XAxisMode;
        setXMode(mode);
        logEvent({ message: 'x-axis mode changed', mode });
    }, [logEvent]);

    // Series computation
    const seriesData = useMemo(() => {
        if (!activity?.logs || activeMetrics.length === 0 || containerLayout.width === 0) {
            return { series: [], elevation: null, xMin: 0, xMax: 0 };
        }

        // Sort: Power always index 0 if present. Others follow.
        const sortedMetrics = [...activeMetrics].sort((a, b) => {
            if (a === 'power') return -1;
            if (b === 'power') return 1;
            return 0;
        });

        const series = computeActivitySeries(
            activity.logs,
            sortedMetrics,
            xMode,
            containerLayout.width,
            ftp,
            units
        );

        const elevation = computeElevationPoints(activity.logs, xMode, containerLayout.width);

        let xMin = 0;
        let xMax = 0;
        if (series.length > 0) {
            const allX = series.flatMap(s => s.points.map(p => p.x));
            xMin = Math.min(...allX);
            xMax = Math.max(...allX);
        }

        return { series, elevation, xMin, xMax };
    }, [activity, activeMetrics, xMode, containerLayout.width, ftp, units]);

    const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
        setContainerLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
        });
    }, []);

    const onTopRowLayout = useCallback((e: LayoutChangeEvent) => {
        setTopRowHeight(e.nativeEvent.layout.height);
    }, []);

    const onBottomRowLayout = useCallback((e: LayoutChangeEvent) => {
        setBottomRowHeight(e.nativeEvent.layout.height);
    }, []);

    const graphHeight = Math.max(0, containerLayout.height - topRowHeight - bottomRowHeight);

    if (!activity) {
        return <View style={[styles.container, style]} onLayout={onContainerLayout} />;
    }

    return (
        <View style={[styles.container, style]} onLayout={onContainerLayout}>
            <View onLayout={onTopRowLayout}>
                <ChipSelect
                    label="Y-Axis"
                    options={metricOptions}
                    multi={true}
                    selectedValues={activeMetrics.map(m => LABEL_TO_METRIC[m])}
                    onValueChange={handleMetricChange}
                />
            </View>

            <ActivityGraphView
                width={containerLayout.width}
                height={graphHeight}
                series={seriesData.series}
                xMode={xMode}
                xMin={seriesData.xMin}
                xMax={seriesData.xMax}
                elevationPoints={seriesData.elevation}
                elevationYMin={activity.logs.reduce((min, l: ActivityLogRecord) => Math.min(min, l.elevation ?? min), Infinity)}
                elevationYMax={activity.logs.reduce((max, l: ActivityLogRecord) => Math.max(max, l.elevation ?? max), -Infinity)}
                showXAxis={true}
                showYAxis={true}
                axisFontSize={resolvedAxisFontSize}
                units={units}
            />

            <View onLayout={onBottomRowLayout}>
                <ChipSelect
                    label="X-Axis"
                    options={['Distance', 'Time']}
                    selected={xMode === 'distance' ? 'Distance' : 'Time'}
                    onValueChange={handleXModeChange}
                />
            </View>

            {toastVisible && (
                <View style={styles.toastContainer} pointerEvents="none">
                    <View style={styles.toast}>
                        <Text style={styles.toastText}>Select max. 2 metrics</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    toastContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    toast: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    toastText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
});