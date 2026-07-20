import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../Icon';
import { colors, textSizes } from '../../../theme';
import { ResultGroupField } from '../ResultGroupField';

interface ResultViewProps {
    compact: boolean;
    workoutName?: string;
    group?: string;
    knownGroups: string[];
    onSetGroup: (group: string) => void;
}

export const ResultView = ({ compact, workoutName, group, knownGroups, onSetGroup }: ResultViewProps) => (
    <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { borderColor: colors.success }]}>
            <Icon name="import-route" size={compact ? 28 : 64} color={colors.success} />
        </View>
        <Text style={[styles.title, compact && styles.titleCompact]}>Import Successful</Text>
        <Text style={[styles.message, compact && styles.messageCompact]}>
            {workoutName
                ? `"${workoutName}" has been added to your library.`
                : 'The workout has been added to your library.'}
        </Text>
        {group !== undefined && (
            <View style={styles.groupFieldContainer}>
                <ResultGroupField label="Group" groups={knownGroups} value={group} onValueChange={onSetGroup} />
            </View>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
    },
    containerCompact: {
        padding: 10,
        minHeight: 160,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconCircleCompact: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        marginBottom: 8,
    },
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: textSizes.listEntry,
        marginBottom: 4,
    },
    message: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    messageCompact: {
        fontSize: textSizes.smallText,
        paddingHorizontal: 10,
    },
    groupFieldContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 8,
    },
});
