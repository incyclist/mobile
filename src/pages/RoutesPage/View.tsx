import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { RoutePageDisplayProps, SearchFilter, DownloadRowDisplayProps } from 'incyclist-services';
import {
    MainBackground,
    NavigationBar,
    RoutesTable,
    FilterPanel,
    TNavigationItem,
} from '../../components';
import { Icon } from '../../components/Icon'; 
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

interface RoutesPageViewProps extends RoutePageDisplayProps {
    onFilterToggle: () => void;
    onNavigate: (item: TNavigationItem) => void;
    onImportClicked: () => void;
    onFilterChanged: (filters:SearchFilter)=>void;
    loading: boolean; 
    compact: boolean;
    showImportDialog: boolean;
    onImportClose: () => void;
    activeDownloadCount: number;
    downloadRows: DownloadRowDisplayProps[];
    showDownloadModal: boolean;
    onDownloadPillPress: () => void;
    onDownloadModalClose: () => void;
    onDownloadStop: (routeId: string) => void;
    onDownloadRetry: (routeId: string) => void;
    onDownloadDelete: (routeId: string) => void;
}

export const RoutesPageView = (props: RoutesPageViewProps) => {
    const {
        loading, 
        synchronizing,
        routes,
        filters,
        filterOptions,
        filterVisible,
        onFilterChanged,
        onFilterToggle,
        onImportClicked,
        onNavigate,
        compact,
        activeDownloadCount,
        onDownloadPillPress,
    } = props;

    const { logEvent } = useLogging('RoutesPageView');

    return (
        <MainBackground>
            <View style={[styles.container, compact && styles.containerCompact]}>
                <View style={[styles.navColumn, compact ? styles.navColumnCompact : styles.navColumnNormal]}>
                    <NavigationBar
                        compact={compact}
                        selected="routes"
                        onClick={onNavigate}
                    />
                </View>

                <View style={styles.contentColumn}>
                    <View style={styles.header}>
                        <View style={styles.headerSide}>
                            {synchronizing && (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.text}
                                    style={styles.syncSpinner}
                                />
                            )}
                        </View>
                        <Text style={styles.headerTitle}>ROUTES</Text>
                        <View style={styles.headerSide}>
                            {activeDownloadCount > 0 && (
                                <TouchableOpacity
                                    style={styles.downloadPill}
                                    onPress={() => {
                                        logEvent({ message: 'button clicked', button: 'download-pill', eventSource: 'user' });
                                        onDownloadPillPress();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.downloadPillText}>↓ {activeDownloadCount}</Text>
                                </TouchableOpacity>
                            )}
                            {!loading && (
                                <TouchableOpacity
                                    style={styles.importButton}
                                    onPress={() => {
                                        logEvent({ message: 'button clicked', button: 'import-route', eventSource: 'user' });
                                        onImportClicked();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="import-route" size={20} color={colors.buttonPrimary} />
                                    <Text style={styles.importButtonText}>Import Route</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.filterArea}>
                        <FilterPanel
                            filters={filters}
                            options={filterOptions!}
                            visible={filterVisible}
                            compact={compact}
                            onFilterChanged={onFilterChanged}
                            onToggle={onFilterToggle}
                        />
                    </View>

                    <View style={styles.listArea}>
                        {loading && routes?.length === 0 ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={colors.tileActive} />
                            </View>
                        ) : (
                            <RoutesTable
                                routes={routes!}
                            />
                        )}
                    </View>
                </View>
            </View>

        </MainBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    containerCompact: {
        flexDirection: 'column',
    },
    navColumn: {
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
    navColumnNormal: {
        width: 150,
    },
    navColumnCompact: {
        height: 56,
        width: '100%',
    },
    contentColumn: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    headerTitle: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
        fontWeight: '700',
        textAlign: 'center',
    },
    headerSide: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    syncSpinner: { marginRight: 10 },

    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.buttonPrimary,
    },
    importButtonText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
    downloadPill: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.buttonPrimary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    downloadPillText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
    filterArea: {
    },
    listArea: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});