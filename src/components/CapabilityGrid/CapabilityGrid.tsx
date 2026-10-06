import React, { useState } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent, useWindowDimensions } from 'react-native'
import { CapabilityTile } from '../CapabilityTile'
import { CapabilityDisplayProps, PairingRowLabelProps } from 'incyclist-services'

interface CapabilityGridProps {
    capabilities?: {
        top: Array<CapabilityDisplayProps>,
        bottom: Array<CapabilityDisplayProps>,
        rowLabels?: { top: PairingRowLabelProps, bottom: PairingRowLabelProps }
    }
    compact: boolean
}

const GAP = 10;
const ASPECT_RATIO = 1.25;
const MAX_TILE_HEIGHT = 200;
const ROW_GAP = 30;
const LABEL_WIDTH = 150;
const PHONE_MAX_SHORT_SIDE = 600;

interface Dimensions {
    w: number,
    h: number,
    containerWidth: number,
}

export const CapabilityGrid = ({ capabilities }: CapabilityGridProps) => {

    const [dimensions, setDimensions] = useState<Dimensions>({ w: 0, h: 0, containerWidth: 0 });
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isPhone = Math.min(screenWidth, screenHeight) < PHONE_MAX_SHORT_SIDE
    const variant = isPhone ? 'short' : 'full'

    if (!capabilities)
        return null

    const onLayout = (event: LayoutChangeEvent) => {
        if (!event?.nativeEvent?.layout)
            return
        const { width, height } = event.nativeEvent.layout;

        const byHeight = Math.min((height - ROW_GAP) / 2, MAX_TILE_HEIGHT);
        const byWidth = (width - 2 * LABEL_WIDTH - GAP * 4) / (3 * ASPECT_RATIO);
        const tileH = Math.max(0, Math.min(byHeight, byWidth));
        setDimensions({ w: tileH * ASPECT_RATIO, h: tileH, containerWidth: width });
    };

    const groupWidth = dimensions.w * 3 + GAP * 2
    const labelLeft = (dimensions.containerWidth - groupWidth) / 2 - GAP - LABEL_WIDTH

    const rows = [
        { label: capabilities.rowLabels?.top, tiles: capabilities.top ?? [] },
        { label: capabilities.rowLabels?.bottom, tiles: capabilities.bottom ?? [] },
    ];

    return (
        <View style={styles.container} onLayout={onLayout}>
            {dimensions.h > 0 && rows.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.row, { height: dimensions.h, marginTop: rowIndex === 0 ? 0 : ROW_GAP }]}>
                    <View style={[styles.label, { width: LABEL_WIDTH, left: labelLeft }]}>
                        <Text style={styles.labelTitle} numberOfLines={1}>{row.label?.text ?? ''}</Text>
                        {row.label?.subtext ? <Text style={styles.labelSubtext}>{row.label.subtext}</Text> : null}
                    </View>
                    {row.tiles.map((tile, index) => (
                        <View
                            key={tile.capability}
                            style={[styles.tile, {
                                width: dimensions.w,
                                height: dimensions.h,
                                marginLeft: index === 0 ? 0 : GAP,
                            }]}
                        >
                            <CapabilityTile {...tile} height={dimensions.h} variant={variant} />
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    labelTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'right',
    },
    labelSubtext: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'right',
    },
    tile: {
        backgroundColor: '#3498db',
        borderRadius: 8
    }
});
