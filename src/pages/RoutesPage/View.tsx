import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity 
} from 'react-native';
import { RouteItemProps } from 'incyclist-services';
import { 
    MainBackground, 
    NavigationBar, 
    RoutesTable, 
    FilterPanel,
    TNavigationItem,
    SearchFilter,
    SearchFilterOptions
} from '../../components';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

interface RoutesPageViewProps {
    loading: boolean;
    synchronizing: boolean;
    routes: RouteItemProps[];
    filters: SearchFilter;
    filterOptions: SearchFilterOptions;
    filterVisible: boolean;
    onFilterChanged: (f: SearchFilter) => void;
    onFilterToggle: () => void;
    onImportClicked: () => void;
    onNavigate: (item: TNavigationItem) => void;
    compact: boolean;
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
                    <View style={styles.header}>
                        <View style={styles.headerSpacer} />
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>ROUTES</Text>
                            {synchronizing && (
                                <ActivityIndicator 
                                    size="small" 
                                    color={colors.text} 
                                    style={styles.syncSpinner} 
                                />
                            )}
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity 
                                style={styles.addButton} 
                                onPress={() => {
                                    logEvent({ message: 'button clicked', button: 'add-route', eventSource: 'user' });
                                    onImportClicked();
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
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
                        {loading && routes.length === 0 ? (
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
        flexDirection: 'column',  // stacks vertically
        alignSelf: 'stretch',     // matches sibling contentColumn height
    },
    contentColumn: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        marginVertical: 5,
    },
    headerSpacer: { flex: 1 },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActions: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: 8,
    },
    title: {
        fontSize: textSizes.pageTitle,
        fontWeight: '700',
        color: colors.text,
    },
    syncSpinner: { marginLeft: 10 },
    addButton: {
        backgroundColor: colors.buttonPrimary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: -2,
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
