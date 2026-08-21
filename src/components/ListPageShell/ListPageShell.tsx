import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MainBackground } from '../MainBackground';
import { NavigationBar } from '../NavigationBar';
import { colors, textSizes } from '../../theme';
import { ListPageShellProps } from './types';

/**
 * Two-column page shell (nav sidebar + header + list area) shared by `WorkoutListView`,
 * `RoutesPage/View` and `ActivitiesPage/ActivitiesPageView` - extracted from a near-identical
 * copy in all three (FIXES_BACKLOG.md item #63 - SonarCloud duplication). Each page still owns
 * its own header content, any content between the header and the list, and - most
 * importantly - its own list-area loading/empty/data branching, since those differ enough
 * between the three that forcing them into the shell would just move the duplication rather
 * than remove it.
 */
export const ListPageShell = ({
    compact,
    navSelected,
    onNavigate,
    title,
    headerLeft,
    headerRight,
    belowHeader,
    children,
}: ListPageShellProps) => (
    <MainBackground>
        <View style={[styles.container, compact && styles.containerCompact]}>
            <View style={[styles.navColumn, compact ? styles.navColumnCompact : styles.navColumnNormal]}>
                <NavigationBar
                    compact={compact}
                    selected={navSelected}
                    onClick={onNavigate}
                />
            </View>

            <View style={styles.contentColumn}>
                <View style={styles.header}>
                    <View style={styles.headerSide}>{headerLeft}</View>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={styles.headerSide}>{headerRight}</View>
                </View>

                {belowHeader}

                <View style={styles.listArea}>
                    {children}
                </View>
            </View>
        </View>
    </MainBackground>
);

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
});
