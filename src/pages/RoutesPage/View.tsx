import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { RoutePageDisplayProps, SearchFilter, IObserver } from 'incyclist-services';
import {
    ListPageShell,
    RoutesTable,
    FilterPanel,
    TNavigationItem,
    DownloadModalView,
    Dynamic,
    DownloadPill,
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
    showDownloadModal: boolean;
    onDownloadPillPress: () => void;
    onDownloadModalClose: () => void;
    onDownloadStop: (routeId: string) => void;
    onDownloadRetry: (routeId: string) => void;
    onDownloadDelete: (routeId: string) => void;
    downloadObserver?: IObserver;
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
        onDownloadPillPress,
        showDownloadModal,
        onDownloadModalClose,
        onDownloadStop,
        onDownloadRetry,
        onDownloadDelete,
        downloadObserver,
    } = props;

    const { logEvent } = useLogging('RoutesPageView');

    const handleDownloadPillPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'download-pill', eventSource: 'user' });
        onDownloadPillPress();
    }, [logEvent, onDownloadPillPress]);

    const handleImportPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'import-route', eventSource: 'user' });
        onImportClicked();
    }, [logEvent, onImportClicked]);

    return (
        <ListPageShell
            compact={compact}
            navSelected="routes"
            onNavigate={onNavigate}
            title="ROUTES"
            headerLeft={synchronizing && (
                <ActivityIndicator
                    size="small"
                    color={colors.text}
                    style={styles.syncSpinner}
                />
            )}
            headerRight={
                <>
                    {downloadObserver && (
                        <>
                            <Dynamic
                                observer={downloadObserver}
                                event="download-update"
                                prop="activeDownloadCount"
                                transform={(data: any) => data.count}
                            >
                                <DownloadPill
                                    activeDownloadCount={0}
                                    onPress={handleDownloadPillPress}
                                />
                            </Dynamic>

                            <Dynamic
                                observer={downloadObserver}
                                event="download-update"
                                prop="rows"
                                transform={(data: any) => data.rows}
                            >
                                <DownloadModalView
                                    rows={[]}
                                    visible={showDownloadModal}
                                    onStop={onDownloadStop}
                                    onRetry={onDownloadRetry}
                                    onDelete={onDownloadDelete}
                                    onClose={onDownloadModalClose}
                                    nested={false}
                                />
                            </Dynamic>
                        </>
                    )}
                    {!loading && (
                        <TouchableOpacity
                            style={styles.importButton}
                            onPress={handleImportPress}
                            activeOpacity={0.7}
                        >
                            <Icon name="import-route" size={20} color={colors.buttonPrimary} />
                            <Text style={styles.importButtonText}>Import Routes</Text>
                        </TouchableOpacity>
                    )}
                </>
            }
            belowHeader={
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
            }
        >
            {loading && routes?.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tileActive} />
                </View>
            ) : (
                <RoutesTable
                    routes={routes!}
                />
            )}
        </ListPageShell>
    );
};

const styles = StyleSheet.create({
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
        fontWeight: '500',
    },
    filterArea: {
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});