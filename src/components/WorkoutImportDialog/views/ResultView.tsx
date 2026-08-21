import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../theme';
import { GroupPicker } from '../../GroupPicker';
import { StatusPanel } from './StatusPanel';

interface ResultViewProps {
    compact: boolean;
    workoutName?: string;
    group?: string;
    knownGroups: string[];
    onSetGroup: (group: string) => void;
}

export const ResultView = ({ compact, workoutName, group, knownGroups, onSetGroup }: ResultViewProps) => (
    <StatusPanel
        compact={compact}
        icon="import-route"
        iconColor={colors.success}
        title="Import Successful"
        message={
            workoutName
                ? `"${workoutName}" has been added to your library.`
                : 'The workout has been added to your library.'
        }
    >
        {group !== undefined && (
            <View style={styles.groupFieldContainer}>
                <GroupPicker label="Group" groups={knownGroups} value={group} onValueChange={onSetGroup} />
            </View>
        )}
    </StatusPanel>
);

const styles = StyleSheet.create({
    groupFieldContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 8,
    },
});
