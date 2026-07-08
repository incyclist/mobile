import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MainBackground, NavigationBar, TNavigationItem } from '../../components';
import { colors, textSizes } from '../../theme';

export interface WorkoutListViewProps {
    onNavigate: (item: TNavigationItem) => void;
}

export const WorkoutListView = ({ onNavigate }: WorkoutListViewProps) => {
    const { height } = useWindowDimensions();
    const compact = height < 420;

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
                        <View style={styles.headerSide} />
                    </View>

                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No workouts found</Text>
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
