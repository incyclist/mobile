import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, SafeAreaView, LayoutChangeEvent } from 'react-native';
import { ActivityDetailsUI } from 'incyclist-services';
import { ActivityGraphView } from './ActivityGraphView';
import { ActivityGraphProps, ActivityMetric, XAxisMode, ActivityGraphSeries } from './types';
import { computeActivitySeries, computeElevationPoints, getAvailableMetrics } from './utils';
import { ChipSelect } from '../ChipSelect';
import { colors, textSizes } from '../../theme';
import { useLogging, useUnmountEffect, useScreenLayout } from '../../hooks';

// Metric label mapping for UI display
const METRIC_LABELS: Record<ActivityMetric, string> = {
    power: 'Power',
    heartrate: 'HR',
    speed: 'Speed',
    cadence: 'Cadence',
};
const LABEL_METRICS: Record<string, ActivityMetric> = {
    Power: 'power',
    HR: 'heartrate',
    Speed: 'speed',
    Cadence: 'cadence',
};

export const ActivityGraph = ({ activity, ftp, units, style }: ActivityGraphProps) => {
    const { logEvent } = useLogging('ActivityGraph');
    const layout = useScreenLayout();
    // Compact axis font size (9) vs normal (11) derived from useScreenLayout
    const axisFontSize = layout === 'compact' ? textSizes.smallText - 3 : textSizes.smallText - 1;

    // State for metric selection (Y-axis)
    const [selectedMetrics, setSelectedMetrics] = useState<ActivityMetric[]>([]);
    // Ref to track the activity that was last used to derive default metrics,
    // preventing re-defaulting on subsequent renders for the same activity object.
    const activityForDefaultsRef = useRef<ActivityDetailsUI | undefined>(undefined);

    // State for X-axis mode
    const [xMode, setXMode] = useState<XAxisMode>('distance');

    // Layout states for measuring component dimensions
    const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });
    const [yAxisControlsLayout, setYAxisControlsLayout] = useState({ height: 0 });
    const [xAxisControlsLayout, setXAxisControlsLayout] = useState({ height: 0 });

    // Toast states for user feedback
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Effect to clear toast timeout on component unmount
    useUnmountEffect(() => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = null;
        }
    });

    // Effect to set default metrics when a new or different activity is provided
    useEffect(() => {
        if (!activity || !activity.logs || activity.logs.length === 0) {
            setSelectedMetrics([]);
            activityForDefaultsRef.current = activity; // Mark as processed
            return;
        }

        // Only set defaults if the activity object reference has changed
        if (activity !== activityForDefaultsRef.current) {
            const available = getAvailableMetrics(activity.logs);
            let defaults: ActivityMetric[] = [];

            if (available.includes('power') && available.includes('heartrate')) {
                defaults = ['power', 'heartrate'];
            } else if (available.includes('power')) {
                defaults = ['power'];
            } else if (available.length > 0) {
                defaults = [available[0]];
            }
            setSelectedMetrics(defaults);
            activityForDefaultsRef.current = activity; // Mark this activity as having had defaults set
        }
    }, [activity]); // Re-run when activity object changes

    // Callback for Y-Axis ChipSelect value change
    const handleMetricSelect = useCallback((labels: string[]) => {
        const newMetrics = labels.map(label => LABEL_METRICS[label]).filter(Boolean) as ActivityMetric[];

        if (newMetrics.length > 2) {
            // If user attempts to select a 3rd metric, show toast and ignore the selection
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
            setToastMessage('Select max. 2 metrics');
            setShowToast(true);
            toastTimeoutRef.current = setTimeout(() => {
                setShowToast(false);
                setToastMessage('');
                toastTimeoutRef.current = null;
            }, 2000);
            // DO NOT call setSelectedMetrics(newMetrics);
            // The ChipSelect component's selectedValues prop will remain `selectedMetrics` (the old, valid state),
            // effectively reverting the UI selection.
        } else {
            setSelectedMetrics(newMetrics);
            logEvent({ message: 'metric selection changed', metrics: newMetrics });
        }
    }, [logEvent]); // Dependencies for useCallback

    // Callback for X-Axis ChipSelect value change
    const handleXModeSelect = useCallback((label: string) => {
        const newXMode: XAxisMode = label === 'Distance' ? 'distance' : 'time';
        setXMode(newXMode);
        logEvent({ message: 'x-axis mode changed', xMode: newXMode });
    }, [logEvent]);

    // Memoized computation of graph series and elevation data
    const computedGraphData = useMemo(() => {
        if (!activity || !activity.logs || activity.logs.length === 0 || containerLayout.width <= 0) {
            return {
                series: [],
                xMin: 0, xMax: 0,
                elevationPoints: null, elevationYMin: undefined, elevationYMax: undefined,
            };
        }

        const logs = activity.logs;
        // Use provided ftp or activity's user ftp
        const effectiveFtp = ftp ?? (activity.user?.ftp ? parseFloat(activity.user.ftp) : undefined);

        // Compute all series for selected metrics
        const allSeries = computeActivitySeries(logs, selectedMetrics, xMode, containerLayout.width, effectiveFtp, units);

        // Y-axis assignment logic: Power always on left if active, otherwise first selected.
        // Second selected metric (if any) goes to the right axis.
        let seriesToRender: ActivityGraphSeries[] = [];
        const powerSeries = allSeries.find(s => s.metric === 'power');
        const nonPowerSeries = allSeries.filter(s => s.metric !== 'power');

        if (powerSeries) {
            seriesToRender.push(powerSeries);
            if (nonPowerSeries.length > 0) {
                seriesToRender.push(nonPowerSeries[0]);
            }
        } else {
            // If no power, first selected goes left, second goes right
            if (nonPowerSeries.length > 0) {
                seriesToRender.push(nonPowerSeries[0]);
            }
            if (nonPowerSeries.length > 1) {
                seriesToRender.push(nonPowerSeries[1]);
            }
        }

        // Compute elevation points
        const elevationData = computeElevationPoints(logs, xMode, containerLayout.width);
        const elevationYMin = elevationData ? Math.min(...elevationData.map(p => p.y)) : undefined;
        const elevationYMax = elevationData ? Math.max(...elevationData.map(p => p.y)) : undefined;

        // Determine overall xMin/xMax from all relevant series (metric + elevation)
        let currentXMin = Infinity;
        let currentXMax = -Infinity;

        // Include metric series X-values for overall domain
        if (seriesToRender.length > 0) {
            const allSeriesXPoints = seriesToRender.flatMap(s => s.points.map(p => p.x));
            if (allSeriesXPoints.length > 0) {
                currentXMin = Math.min(currentXMin, ...allSeriesXPoints);
                currentXMax = Math.max(currentXMax, ...allSeriesXPoints);
            }
        }

        // Include elevation series X-values for overall domain
        if (elevationData && elevationData.length > 0) {
             const allElevationXPoints = elevationData.map(p => p.x);
             if (allElevationXPoints.length > 0) {
                currentXMin = Math.min(currentXMin, ...allElevationXPoints);
                currentXMax = Math.max(currentXMax, ...allElevationXPoints);
             }
        }

        return {
            series: seriesToRender,
            xMin: currentXMin === Infinity ? 0 : currentXMin, // Default to 0 if no valid X-range found
            xMax: currentXMax === -Infinity ? 0 : currentXMax, // Default to 0 if no valid X-range found
            elevationPoints: elevationData,
            elevationYMin,
            elevationYMax,
        };
    }, [activity, selectedMetrics, xMode, containerLayout.width, ftp, units]);

    // Calculate available height for the graph component
    const graphHeight = Math.max(0, containerLayout.height - yAxisControlsLayout.height - xAxisControlsLayout.height);
    const graphWidth = containerLayout.width;

    // Memoized list of available metric labels for the Y-Axis ChipSelect
    const availableMetricOptions = useMemo(() => {
        if (!activity || !activity.logs || activity.logs.length === 0) return [];
        return getAvailableMetrics(activity.logs).map(metric => METRIC_LABELS[metric]);
    }, [activity]);

    // Options for the X-Axis ChipSelect
    const xModeOptions = ['Distance', 'Time'];

    // Render a message if no activity data is present
    if (!activity || !activity.logs || activity.logs.length === 0) {
        return (
            <View style={[styles.container, style]} onLayout={(e: LayoutChangeEvent) => setContainerLayout(e.nativeEvent.layout)}>
                <Text style={styles.noDataText}>No activity data available.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]} onLayout={(e: LayoutChangeEvent) => setContainerLayout(e.nativeEvent.layout)}>
            {/* Y-Axis Controls */}
            <View onLayout={(e: LayoutChangeEvent) => setYAxisControlsLayout(e.nativeEvent.layout)}>
                <ChipSelect
                    label="Y-Axis"
                    options={availableMetricOptions}
                    selectedValues={selectedMetrics.map(m => METRIC_LABELS[m])}
                    onValueChange={handleMetricSelect}
                    multi={true}
                />
            </View>

            {/* Main Activity Graph View */}
            {graphWidth > 0 && graphHeight > 0 && (
                <ActivityGraphView
                    width={graphWidth}
                    height={graphHeight}
                    series={computedGraphData.series}
                    xMode={xMode} // Pass xMode directly from state
                    xMin={computedGraphData.xMin}
                    xMax={computedGraphData.xMax}
                    elevationPoints={computedGraphData.elevationPoints}
                    elevationYMin={computedGraphData.elevationYMin}
                    elevationYMax={computedGraphData.elevationYMax}
                    showXAxis={true} // Always show X-Axis
                    showYAxis={true} // Always show Y-Axis (left, right if second series exists)
                    axisFontSize={axisFontSize}
                    units={units}
                />
            )}

            {/* X-Axis Controls */}
            <View onLayout={(e: LayoutChangeEvent) => setXAxisControlsLayout(e.nativeEvent.layout)}>
                <ChipSelect
                    label="X-Axis"
                    options={xModeOptions}
                    selected={xMode === 'distance' ? 'Distance' : 'Time'} // Map xMode enum to label string
                    onValueChange={handleXModeSelect}
                    multi={false}
                />
            </View>

            {/* Toast for error messages */}
            {showToast && (
                <SafeAreaView style={styles.toastContainer} pointerEvents='none'>
                    <View style={styles.toast}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </View>
                </SafeAreaView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    noDataText: {
        color: colors.text,
        fontSize: textSizes.noDataText,
        textAlign: 'center',
        marginTop: 50,
    },
    toastContainer: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toast: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    toastText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
    },
});