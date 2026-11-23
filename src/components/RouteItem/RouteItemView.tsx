import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { RouteItemViewProps } from './types';
import { colors } from '../../theme';
import { getFlagEmoji } from '../../utils/flags';
import { FreeMap } from '../FreeMap';
import { ElevationGraph } from '../ElevationGraph';
import { Icon } from '../Icon';
import { SecureImage } from '../SecureImage';
import { RouteSourcePill, RouteSourceSubline, PILL_WIDTH } from '../RouteSource';

// Conditional import to prevent Storybook Vite from crashing
let Swipeable: any = View;
try {
    if (Platform.OS !== 'web') {
        Swipeable = require('react-native-gesture-handler').Swipeable;
    }
} catch {
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
        outsideFold,
        onSelect,
        onDelete,
        onDeleteLocalCopy,
        sourceTreeUri,
        videoPill,
        availability,
        sourceLabel,
        thumbnailLink,
        linkShared,
    } = props;

    const unavailable = availability === 'unavailable';
    const fromLink = availability === 'fromLink';
    // a copy on this device of a route a computer shares: only the copy is deleted
    const hasLocalCopyOfSharedRoute = availability === 'local' && !!linkShared && !!onDeleteLocalCopy;
    const hasSwipeAction = !unavailable && !fromLink;

    if (outsideFold) {
        return <View style={styles.placeholderContainer} />;
    }

    const renderMedia = () => {

        if (hasVideo && (previewUrl || thumbnailLink)) {
            const source = previewUrl ? { uri: previewUrl } : undefined;
            return (
                <SecureImage
                    source={source}
                    thumbnailRouteKey={id}
                    thumbnailLink={thumbnailLink}
                    fallback={renderShape()}
                    style={styles.media}
                    resizeMode="cover"
                />
            );
        }
        return renderShape();
    };

    // the route's shape; also what a thumbnail that could not be fetched is replaced with
    const renderShape = () => {
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
        if (!loaded) {
            return <ActivityIndicator size="small" color={colors.text} />;
        }

        return null;
    };

    const renderRightActions = () => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => (hasLocalCopyOfSharedRoute ? onDeleteLocalCopy!(id!) : onDelete(id!))}
        >
            <Text style={styles.deleteText}>{hasLocalCopyOfSharedRoute ? 'Delete download' : 'Delete'}</Text>
        </TouchableOpacity>
    );

    const routeData =
        points && points.length > 0
            ? {
                  id:id!,
                  title:title!,
                  points,
                  distance: points[points.length - 1].routeDistance,
              }
            : undefined;

    return (
        <Swipeable renderRightActions={hasSwipeAction ? renderRightActions : undefined}>
            <TouchableOpacity
                style={styles.container}
                onPress={() => onSelect(id!)}
                activeOpacity={0.9}
            >
                <View style={styles.leftColumn}>
                    <View style={[styles.mediaWrapper, unavailable && styles.dimmed]}>{renderMedia()}</View>
                    {routeData ? (
                        <ElevationGraph
                            routeData={routeData}
                            showLine={false}
                            showColors={false}
                            showXAxis={false}
                            showYAxis={false}
                            style={unavailable ? styles.graphDimmed : styles.graphPlaceholder}
                            minElevationRange={300}
                        />
                    ) : (
                        <View style={unavailable ? styles.graphDimmed : styles.graphPlaceholder} />
                    )}
                </View>

                <View style={styles.middleColumn}>
                    <View style={[styles.titleRow, (fromLink || unavailable) && styles.titleRowWithSource]}>
                        <Text style={[styles.title, unavailable && styles.disabledText]} numberOfLines={1}>
                            {title}
                        </Text>
                        <Text style={styles.flag}>{getFlagEmoji(country)}</Text>
                    </View>

                    <View style={styles.detailsRow}>
                        <Text style={[styles.detailText, unavailable && styles.disabledText]}>{hasVideo ? 'Video' : 'GPX'}</Text>
                        <Text style={[styles.detailSeparator, unavailable && styles.disabledText]}>•</Text>
                        <Text style={[styles.detailText, unavailable && styles.disabledText]}>{isLoop ? 'Loop' : 'Point to Point'}</Text>
                        <RouteSourceSubline availability={availability} sourceLabel={sourceLabel} />
                    </View>

                    <View style={styles.pillContainer}>
                        <RouteSourcePill availability={availability} />
                        {!!sourceTreeUri && (
                            <View style={[styles.pill, styles.pillExternal]}>
                                <Icon name="import-route" size={10} color={colors.text} />
                            </View>
                        )}
                        {videoPill === 'downloading' && (
                            <View style={[styles.pill, styles.pillVideoDownloading]}>
                                <Text style={styles.pillText}>Downloading</Text>
                            </View>
                        )}
                        {videoPill === 'in-icloud' && (
                            <View style={[styles.pill, styles.pillVideoICloud]}>
                                <Text style={styles.pillText}>In iCloud</Text>
                            </View>
                        )}
                        {isNew && (
                            <View style={[styles.pill, styles.pillNew]}>
                                <Text style={styles.pillText}>New</Text>
                            </View>
                        )}
                        {(cntActive ?? 0) > 0 && (
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

                <View style={styles.rightColumn}>

                    <View style={styles.statsGrid}>
                        {totalDistance!==undefined && totalDistance!==null && <View style={styles.statsCol}>
                            <Icon name="distance" size={16} color={colors.text} />
                            <Text style={[styles.statsValue, unavailable && styles.disabledText]}>{totalDistance.value}</Text>
                            <Text style={[styles.statsUnit, unavailable && styles.disabledText]}>{totalDistance.unit}</Text>
                        </View> }
                        
                        {totalElevation!==undefined && totalElevation!==null && <View style={styles.statsCol}>
                            <Icon name="elevation" size={16} color={colors.text} />
                            <Text style={[styles.statsValue, unavailable && styles.disabledText]}>{totalElevation.value}</Text>
                            <Text style={[styles.statsUnit, unavailable && styles.disabledText]}>{totalElevation.unit}</Text>
                        </View>}
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
        height: ITEM_HEIGHT + MARGIN_V * 2,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    container: {
        height: ITEM_HEIGHT,
        backgroundColor: colors.listItemBackground,
        marginVertical: MARGIN_V,
        marginHorizontal: 12,
        borderRadius: 6,
        flexDirection: 'row',
        padding: 6,
    },
    leftColumn: {
        flexDirection: 'row',
        width: 194,
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
    // the pill container is laid over the title row: keep the title clear of the source pill
    titleRowWithSource: {
        paddingRight: PILL_WIDTH + 4,
    },
    // thumbnail and elevation graph of a route that can not be started: dimmed, the text is not
    dimmed: { opacity: 0.4 },
    graphDimmed: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 4,
        opacity: 0.4,
    },
    disabledText: { color: colors.disabled },

    title: {
        color: colors.text,
        fontSize: 18,
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
        color: colors.text,
        fontSize: 12,
    },
    detailSeparator: {
        color: colors.text,
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
    pillExternal: { backgroundColor: colors.tileIdle },
    pillVideoDownloading: { backgroundColor: colors.tileActive },
    pillVideoICloud: { backgroundColor: colors.tileIdle },
    pillText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    pillTextActive: { color: '#000000', fontSize: 10, fontWeight: 'bold' },

    rightColumn: {
        width: 120,
        flexDirection: 'row',  // ← move row here
        alignItems: 'flex-start',  // ← align to top
        paddingTop: 0,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flex: 1,
    },
    statsValue: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,  // space between icon and value
    },
    statsUnit: {
        color: colors.text,
        fontSize: 10,
        marginTop: 1,
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