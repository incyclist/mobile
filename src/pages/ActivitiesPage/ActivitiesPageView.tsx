import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { ActivitiesPageDisplayProps } from 'incyclist-services';
import { ListPageShell, ActivitiesTable, TNavigationItem } from '../../components';
import { colors, textSizes } from '../../theme';

export interface ActivitiesPageViewProps {
    props: ActivitiesPageDisplayProps | null;
    onSelectActivity: (id: string) => void;
    onDeleteActivity: (id: string) => void;
    onNavigate: (item: TNavigationItem) => void;
}

export const ActivitiesPageView = ({ props, onSelectActivity, onDeleteActivity, onNavigate }: ActivitiesPageViewProps) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;
    const activities = props?.activities ?? [];
    const isLoading = props?.loading ?? false;

    return (
        <ListPageShell
            compact={compact}
            navSelected="activities"
            onNavigate={onNavigate}
            title="ACTIVITIES"
        >
            { isLoading && activities.length === 0 &&
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tileActive} />
                </View>
            }
            { !isLoading && activities.length === 0 &&
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No activities found</Text>
                </View>
            }
            { !isLoading && activities.length >0 &&
                <ActivitiesTable activities={activities} onSelect={onSelectActivity} onDelete={onDeleteActivity} />
            }
        </ListPageShell>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: colors.text,
        fontSize: textSizes.noDataText,
        textAlign: 'center',
    },
});