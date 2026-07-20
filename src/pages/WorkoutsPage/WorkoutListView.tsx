import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { WorkoutListContentProps } from 'incyclist-services';
import { MainBackground, NavigationBar, TNavigationItem, WorkoutsTable } from '../../components';
import { Icon } from '../../components/Icon';
import { colors, textSizes } from '../../theme';
import { useLogging } from '../../hooks';

export interface WorkoutListViewProps {
    data: WorkoutListContentProps;
    onNavigate: (item: TNavigationItem) => void;
    onImport: () => void;
    onSelectGroup: (group: string | null) => void;
}

export const WorkoutListView = ({ data, onNavigate, onImport, onSelectGroup }: WorkoutListViewProps) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;
    const { logEvent } = useLogging('WorkoutListView');

    const handleImportPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'import-workouts', eventSource: 'user' });
        onImport();
    }, [logEvent, onImport]);

    return (
        <MainBackground>
            <View style={[styles.container, compact && styles.containerCompact]}>
                <View style={[styles.navColumn, compact ? styles.navColumnCompact : styles.navColumnNormal]}>
                    <NavigationBar
                        compact={compact}
                        selected="workouts"
                        onClick={onNavigate}
                    />
                </View>

                <View style={styles.contentColumn}>
                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <Text style={styles.headerTitle}>WORKOUTS</Text>
                        <View style={styles.headerSide}>
                            {!data.loading && (
                                <TouchableOpacity
                                    style={styles.importButton}
                                    onPress={handleImportPress}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="import-route" size={20} color={colors.buttonPrimary} />
                                    <Text style={styles.importButtonText}>Import Workouts</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.listArea}>
                        {data.loading && data.isEmpty ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={colors.tileActive} />
                            </View>
                        ) : (
                            <WorkoutsTable
                                data={data}
                                compact={compact}
                                onSelectGroup={onSelectGroup}
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
    listArea: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
