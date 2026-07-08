import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MainBackground, NavigationBar, TNavigationItem } from '../../components';
import { Button } from '../../components/ButtonBar';
import { WorkoutTrainerIllustration } from './WorkoutTrainerIllustration';
import { colors, textSizes } from '../../theme';

export interface WorkoutsPlaceholderViewProps {
    onNavigate: (item: TNavigationItem) => void;
}

export const WorkoutsPlaceholderView = ({ onNavigate }: WorkoutsPlaceholderViewProps) => {
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
                        {!compact && (
                            <WorkoutTrainerIllustration size={180} />
                        )}
                        <Text style={[styles.descriptionText, compact && styles.descriptionTextCompact]}>
                            Train smarter with structured workouts. Follow power-based intervals and training plans — synced from intervals.icu. Coming soon.
                        </Text>
                        <Button
                            label="I'm interested"
                            onClick={() => {}}
                        />
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
    descriptionText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 16,
        maxWidth: 380,
    },
    descriptionTextCompact: {
        marginTop: 8,
        marginBottom: 8,
    },
});
