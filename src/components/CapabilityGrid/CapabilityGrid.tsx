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
const LABEL_WIDTH = 84;
const PHONE_MAX_SHORT_SIDE = 600;

interface Dimensions {
    w: number,
    h: number,
}

export const CapabilityGrid = ({ capabilities }: CapabilityGridProps) => {

    const [dimensions, setDimensions] = useState<Dimensions>({ w: 0, h: 0 });
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isPhone = Math.min(screenWidth, screenHeight) < PHONE_MAX_SHORT_SIDE
    const variant = isPhone ? 'short' : 'full'

    if (!capabilities)
        return null

    const onLayout = (event: LayoutChangeEvent) => {
        if (!event?.nativeEvent?.layout)
            return
        const { width, height } = event.nativeEvent.layout;

        const byHeight = Math.min((height - GAP) / 2, MAX_TILE_HEIGHT);
        const byWidth = (width - LABEL_WIDTH - GAP * 3) / (3 * ASPECT_RATIO);
        const tileH = Math.max(0, Math.min(byHeight, byWidth));
        setDimensions({ w: tileH * ASPECT_RATIO, h: tileH });
    };

    const rows = [
        { label: capabilities.rowLabels?.top, tiles: capabilities.top ?? [] },
        { label: capabilities.rowLabels?.bottom, tiles: capabilities.bottom ?? [] },
    ];

    return (
        <View style={styles.container} onLayout={onLayout}>
            {dimensions.h > 0 && rows.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.row, { height: dimensions.h }]}>
                    <View style={[styles.label, { width: LABEL_WIDTH }]}>
                        <Text style={styles.labelTitle} numberOfLines={1}>{row.label?.text ?? ''}</Text>
                        {row.label?.subtext ? <Text style={styles.labelSubtext}>{row.label.subtext}</Text> : null}
                    </View>
                    {row.tiles.map((tile) => (
                        <View
                            key={tile.capability}
                            style={[styles.tile, {
                                width: dimensions.w,
                                height: dimensions.h,
                                marginLeft: GAP,
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
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: GAP,
    },
    label: {
        justifyContent: 'center',
    },
    labelTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    labelSubtext: {
        color: '#fff',
        fontSize: 12,
    },
    tile: {
        backgroundColor: '#3498db',
        borderRadius: 8
    }
});
