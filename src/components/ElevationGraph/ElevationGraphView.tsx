import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { ElevationGraphViewProps } from './types';
import { computeMargins } from './utils';
import { ElevationGraphBars } from './ElevationGraphBars';
import { ElevationGraphLine } from './ElevationGraphLine';
import { ElevationGraphAxes } from './ElevationGraphAxes';
import { ElevationGraphMarker } from './ElevationGraphMarker';
import { colors } from '../../theme';

export const ElevationGraphView = memo((props: ElevationGraphViewProps) => {
    const {
        width,
        height,
        graphPoints,
        domain,
        showXAxis = false,
        showYAxis = false,
        showLine = true,
        showColors = true,
        backgroundColor = 'transparent',
        xScale,
        yScale,
        axisFontSize,
        markerPosition,
        currentAvatar,
        markers,
        lapMode,
        previewColor
    } = props;

    const margins = useMemo(() => computeMargins(showXAxis, showYAxis), [showXAxis, showYAxis]);
    
    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;

    const lineFill = useMemo(() => {
        if (showLine) return 'rgba(255,255,255,0.15)';
        return showColors ? 'transparent' : previewColor??colors.elevationPreviewColor;
    }, [showLine, showColors,previewColor]);

    if (width <= 0 || height <= 0 || !graphPoints || !domain) return null;

    return (
        <View style={[styles.container, { width, height, backgroundColor }]}>
            {/* 1. Static Layer */}
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
                {showColors && (
                    <ElevationGraphBars
                        graphPoints={graphPoints}
                        domain={domain}
                        margins={margins}
                        plotWidth={plotWidth}
                        plotHeight={plotHeight}
                        showColors={showColors}
                    />
                )}
                
                <ElevationGraphLine
                    graphPoints={graphPoints}
                    domain={domain}
                    margins={margins}
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                    fillColor={lineFill}
                    showStroke={showLine}
                />
                
                <ElevationGraphAxes
                    domain={domain}
                    margins={margins}
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                    showXAxis={showXAxis}
                    showYAxis={showYAxis}
                    xScale={xScale}
                    yScale={yScale}
                    axisFontSize={axisFontSize}
                />
            </Svg>

            {/* 2. Dynamic Layer for Markers */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width={width} height={height}>
                    <ElevationGraphMarker
                        domain={domain}
                        margins={margins}
                        plotWidth={plotWidth}
                        plotHeight={plotHeight}
                        graphPoints={graphPoints}
                        markerPosition={markerPosition}
                        currentAvatar={currentAvatar}
                        markers={markers}
                        xScale={xScale}
                        lapMode={lapMode}
                    />
                </Svg>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        overflow: 'visible',
    },
});
