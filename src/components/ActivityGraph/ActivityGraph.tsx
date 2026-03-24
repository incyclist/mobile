import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import { ActivityDetailsUI } from 'incyclist-services';
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
import { useUnmountEffect } from '../../hooks/unmount';
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
    const { isCompact } = useScreenLayout();
    const [xMode, setXMode] = useState<XAxisMode>('distance');
    const [activeMetrics, setActiveMetrics] = useState<ActivityMetric[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [controlsHeight, setControlsHeight] = useState(0);

    const refToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const axisFontSize = propsAxisFontSize ?? (isCompact ? 9 : 11);

    const availableMetrics = useMemo(() => 
        getAvailableMetrics(activity?.logs ?? []), 
    [activity?.logs]);

    // Initialize metrics
    useEffect(() => {
        if (availableMetrics.length === 0) {
            setActiveMetrics([]);
            return;
        }

        const defaults: ActivityMetric[] = [];
        if (availableMetrics.includes('power')) defaults.push('power');
        if (availableMetrics.includes('heartrate')) defaults.push('heartrate');

        if (defaults.length === 0) {
            setActiveMetrics([availableMetrics[0]]);
        } else if (defaults.length === 1 && defaults[0] === 'power') {
             setActiveMetrics(['power']);
        } else {
            setActiveMetrics(defaults);
        }
    }, [availableMetrics]);

    const triggerToast = useCallback(() => {
        setShowToast(true);
        if (refToastTimeout.current) {
            clearTimeout(refToastTimeout.current);
        }
        refToastTimeout.current = setTimeout(() => {
            setShowToast(false);
        }, 2000);
    }, []);

    useUnmountEffect(() => {
        if (refToastTimeout.current) {
            clearTimeout(refToastTimeout.current);
        }
    });

    const onMetricToggle = useCallback((metric: string) => {
        const m = metric as ActivityMetric;
        setActiveMetrics(prev => {
            if (prev.includes(m)) {
                return prev.filter(item => item !== m);
            }
            if (prev.length >= 2) {
                triggerToast();
                return prev;
            }
            return [...prev, m];
        });
    }, [triggerToast]);

    const onContainerLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    };

    const onControlsLayout = (event: LayoutChangeEvent) => {
        setControlsHeight(event.nativeEvent.layout.height);
    };

    const series: ActivityGraphSeries[] = useMemo(() => {
        if (dimensions.width <= 0) return [];

        const computed = computeActivitySeries(
            activity?.logs ?? [],
            activeMetrics,
            xMode,
            dimensions.width,
            ftp,
            units
        );

        // Y-axis assignment: Power always series[0] (left). 
        // Others series[1] (right) if power is present.
        // If power not present, first selected is series[0].
        return computed.sort((a, b) => {
            if (a.metric === 'power') return -1;
            if (b.metric === 'power') return 1;
            return 0;
        });
    }, [activity, activeMetrics, xMode, dimensions.width, ftp, units]);

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
                    options={['distance', 'time']}
                    selectedValues={[xMode]}
                    onSelect={(v) => setXMode(v as XAxisMode)}
                    multi={false}
                    optionLabels={{ distance: 'Distance', time: 'Time' }}
                />
                <View style={styles.spacer} />
                <ChipSelect
                    label=""
                    options={availableMetrics}
                    selectedValues={activeMetrics}
                    onSelect={onMetricToggle}
                    multi={true}
                    optionLabels={{
                        power: 'Power',
                        heartrate: 'Heart Rate',
                        speed: 'Speed',
                        cadence: 'Cadence'
                    }}
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

                {showToast && (
                    <View style={styles.toastContainer} pointerEvents="none">
                        <View style={styles.toast}>
                            <Text style={styles.toastText}>Select max. 2 metrics</Text>
                        </View>
                    </View>
                )}
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
    toastContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toast: {
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    toastText: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
});