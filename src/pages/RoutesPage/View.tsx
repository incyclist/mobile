import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { RoutePageDisplayProps } from 'incyclist-services';
import {
    MainBackground,
    NavigationBar,
    RoutesTable,
    FilterPanel,
    TNavigationItem,
} from '../../components';
import { Icon } from '../../components/Icon'; // Added import for Icon
import { colors, textSizes } from '../../theme';
import { useLogging, useWhyDidYouRender } from '../../hooks';

interface RoutesPageViewProps extends RoutePageDisplayProps {
    onFilterToggle: () => void;
    onNavigate: (item: TNavigationItem) => void;
    onImportClicked: () => void;
    loading: boolean; // Added to props interface
    compact: boolean;
}

export const RoutesPageView = (props: RoutesPageViewProps) => {
    const {
        loading, // Destructured
        synchronizing,
        routes,
        filters,
        filterOptions,
        filterVisible,
        onFilterChanged,
        onFilterToggle,
        onImportClicked,
        onNavigate,
        compact
    } = props;

    const { logEvent } = useLogging('RoutesPageView');

    return (
        <MainBackground>
            <View style={styles.container}>
                <View style={[styles.navColumn, { width: compact ? 70 : 150 }]}>
                    <NavigationBar
                        compact={compact}
                        position="left"
                        selected="routes"
                        onClick={onNavigate}
                    />
                </View>

                <View style={styles.contentColumn}>
                    {/* New Header Layout */}
                    <View style={styles.header}>
                        <View style={styles.headerSide}>
                            {synchronizing && ( // Keep synchronizing indicator with the title, if it's not removed
                                <ActivityIndicator
                                    size="small"
                                    color={colors.text}
                                    style={styles.syncSpinner}
                                />
                            )}
                        </View>
                        <Text style={styles.headerTitle}>ROUTES</Text>
                        <View style={styles.headerSide}>
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
                            options={filterOptions}
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
                                routes={routes}
                                onSelect={() => {}}
                                onDelete={() => {}}
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
    navColumn: {
        flexDirection: 'column',
        alignSelf: 'stretch',
    },
    contentColumn: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    // New Header styles
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
        flexDirection: 'row', // To align sync spinner if needed
        alignItems: 'center',
        justifyContent: 'flex-end', // Align items to the right within the side
    },
    syncSpinner: { marginRight: 10 }, // Adjusted margin for spinner placement

    // Import Route button styles
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
    filterArea: {
        // Height determined by FilterPanel content
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
