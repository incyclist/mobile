import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { RouteItemViewProps } from './types';
import { colors  } from '../../theme';
import { getFlagEmoji } from '../../utils/flags';
import { FreeMap } from '../FreeMap';

// Conditional import to prevent Storybook Vite from crashing
let Swipeable: any = View;
try {
    if (Platform.OS !== 'web') {
        Swipeable = require('react-native-gesture-handler').Swipeable;
    }
} catch  {
    // Fallback for web/environments where gesture handler isn't linked
    Swipeable = ({ children }: any) => <View>{children}</View>;
}

export const RouteItemView = (props: RouteItemViewProps) => {
    const {
        id,
        title,
        country,
        totalDistance,
        totalElevation,
        hasVideo,
        previewUrl,
        points,
        isLoop,
        isNew,
        isDemo,
        cntActive,
        loaded,
//        outsideFold,
        onSelect,
        onDelete
    } = props;

    // if (outsideFold) {
    //     return <View style={styles.placeholderContainer} />;
    // }

    const renderMedia = () => {
        if (!loaded) {
            return <ActivityIndicator size="small" color={colors.text} />;
        }

        if (hasVideo && previewUrl) {
            return <Image source={{ uri: previewUrl }} style={styles.media} resizeMode="cover" />;
        }

        if (points && points.length > 0) {
            return (
                <FreeMap 
                    points={points} 
                    zoom={10} 
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                />
            );
        }
        return null;
    };

    const renderRightActions = () => (
        <TouchableOpacity 
            style={styles.deleteAction} 
            onPress={() => onDelete(id!)}
        >
            <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
    );

    return (
        <Swipeable renderRightActions={renderRightActions}>
            <TouchableOpacity 
                style={styles.container} 
                onPress={() => onSelect(id!)}
                activeOpacity={0.9}
            >
                {/* Column 1: Media & Graph */}
                <View style={styles.leftColumn}>
                    <View style={styles.mediaWrapper}>
                        {renderMedia()}
                    </View>
                    <View style={styles.graphPlaceholder} />
                </View>

                {/* Column 2: Info (Title, Pills, Details) */}
                <View style={styles.middleColumn}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <Text style={styles.flag}>{getFlagEmoji(country)}</Text>
                    </View>

                    <View style={styles.detailsRow}>
                        <Text style={styles.detailText}>{hasVideo ? 'Video' : 'GPX'}</Text>
                        <Text style={styles.detailSeparator}>•</Text>
                        <Text style={styles.detailText}>{isLoop ? 'Loop' : 'Point to Point'}</Text>
                    </View>

                    {/* Pills sit in the top/middle area of this column */}
                    <View style={styles.pillContainer}>
                        {isNew && (
                            <View style={[styles.pill, styles.pillNew]}>
                                <Text style={styles.pillText}>New</Text>
                            </View>
                        )}
                        {(cntActive??0) > 0 && (
                            <View style={[styles.pill, styles.pillActive]}>
                                <Text style={styles.pillTextActive}>{cntActive}</Text>
                            </View>
                        )}
                        {isDemo && (
                            <View style={[styles.pill, styles.pillDemo]}>
                                <Text style={styles.pillText}>Demo</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Column 3: Stats (Distance & Elevation) */}
                <View style={styles.rightColumn}>
                    {/* Reserve space for icons as headers later */}
                    <View style={styles.statsHeaderSpace} />
                    
                    <View style={styles.statsGrid}>
                        <View style={styles.statsCol}>
                            <Text style={styles.statsValue}>{totalDistance.value}</Text>
                            <Text style={styles.statsUnit}>{totalDistance.unit}</Text>
                        </View>
                        <View style={styles.statsCol}>
                            <Text style={styles.statsValue}>{totalElevation.value}</Text>
                            <Text style={styles.statsUnit}>{totalElevation.unit}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

const ITEM_HEIGHT = 76;
const MARGIN_V = 4;

const styles = StyleSheet.create({
    placeholderContainer: {
        height: ITEM_HEIGHT + (MARGIN_V * 2),
    },
    container: {
        height: ITEM_HEIGHT,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: MARGIN_V,
        marginHorizontal: 12,
        borderRadius: 6,
        flexDirection: 'row',
        padding: 6,
    },
    leftColumn: {
        flexDirection: 'row',
        width: 140,
        height: '100%',
        gap: 6,
    },
    mediaWrapper: {
        width: 80,
        height: '100%',
        backgroundColor: '#222',
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    graphPlaceholder: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
    },
    middleColumn: {
        flex: 1,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: colors.text,
        fontSize: 18, // Bigger font as requested
        fontWeight: 'bold',
        flexShrink: 1,
    },
    flag: {
        fontSize: 18,
        marginLeft: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    detailText: {
        color: colors.disabled,
        fontSize: 12,
    },
    detailSeparator: {
        color: colors.disabled,
        marginHorizontal: 6,
    },
    pillContainer: {
        flexDirection: 'row',
        position: 'absolute',
        top: 0,
        right: 0,
        gap: 4,
    },
    pill: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    pillNew: { backgroundColor: '#FFBF00' },
    pillActive: { backgroundColor: '#4CAF50' },
    pillDemo: { backgroundColor: '#8BC34A' },
    pillText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    pillTextActive: { color: '#000000', fontSize: 10, fontWeight: 'bold' },
    
    rightColumn: {
        width: 120,
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsHeaderSpace: {
        height: 14, // Space for future icons
    },
    statsGrid: {
        flexDirection: 'row',
        flex: 1,
    },
    statsCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsValue: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    statsUnit: {
        color: colors.disabled,
        fontSize: 10,
    },
    deleteAction: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: ITEM_HEIGHT,
        marginVertical: MARGIN_V,
        borderRadius: 6,
    },
    deleteText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});