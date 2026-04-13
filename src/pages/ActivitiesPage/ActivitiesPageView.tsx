import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { ActivitiesPageDisplayProps } from 'incyclist-services';
import { MainBackground, NavigationBar, ActivitiesTable, TNavigationItem } from '../../components';
import { colors, textSizes } from '../../theme';

export interface ActivitiesPageViewProps {
    props: ActivitiesPageDisplayProps | null;
    onSelectActivity: (id: string) => void;
    onNavigate: (item: TNavigationItem) => void;
}

export const ActivitiesPageView = ({ props, onSelectActivity, onNavigate }: ActivitiesPageViewProps) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;

    const activities = props?.activities ?? [];
    const isLoading = props?.loading ?? false;

    const content = useMemo(() => {
        if (isLoading && activities.length === 0) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tileActive} />
                </View>
            );
        }

        if (!isLoading && activities.length === 0) {
            return (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No activities found</Text>
                </View>
            );
        }

        return <ActivitiesTable activities={activities} onSelect={onSelectActivity} />;
    }, [isLoading, activities, onSelectActivity]);

    return (
        <MainBackground>
            <View style={[styles.container, compact && styles.containerCompact]}>
                <View style={[styles.navColumn, compact ? styles.navColumnCompact : styles.navColumnNormal]}>
                    <NavigationBar
                        compact={compact}
                        selected="activities"
                        onClick={onNavigate}
                    />
                </View>

                <View style={styles.contentColumn}>
                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <Text style={styles.headerTitle}>ACTIVITIES</Text>
                        <View style={styles.headerSide} />
                    </View>

                    <View style={styles.listArea}>
                        {content}
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
    listArea: {
        flex: 1,
    },
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