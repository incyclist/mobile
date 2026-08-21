import React, { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { WorkoutListContentProps } from 'incyclist-services';
import { ListPageShell, TNavigationItem, WorkoutsTable } from '../../components';
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
        <ListPageShell
            compact={compact}
            navSelected="workouts"
            onNavigate={onNavigate}
            title="WORKOUTS"
            headerRight={!data.loading && (
                <TouchableOpacity
                    style={styles.importButton}
                    onPress={handleImportPress}
                    activeOpacity={0.7}
                >
                    <Icon name="import-route" size={20} color={colors.buttonPrimary} />
                    <Text style={styles.importButtonText}>Import Workouts</Text>
                </TouchableOpacity>
            )}
        >
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
        </ListPageShell>
    );
};

const styles = StyleSheet.create({
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
