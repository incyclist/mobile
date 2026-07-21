import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dialog } from '../Dialog';
import { WorkoutGraph } from '../WorkoutGraph';
import { EditNumber } from '../EditNumber';
import { BinarySelect } from '../BinarySelect';
import { GroupPicker } from '../GroupPicker';
import { WorkoutDetailsViewProps } from './types';
import { colors, textSizes } from '../../theme';
import { WorkoutGraphPlan } from 'incyclist-services';

const GRAPH_HEIGHT = 200;
// Compact mode (workout-mobile-hld.md: Dialog forces landscape regardless of the
// underlying page's orientation) gets its own column instead of being squeezed below
// the settings fields, so it can afford to be taller than the old single-column value.
const GRAPH_HEIGHT_COMPACT = 160;

interface SettingsColumnProps {
    ftp: number;
    useErgMode: boolean;
    groups: string[];
    group: string;
    isScheduled: boolean;
    onFtpChange: (value?: number) => void;
    onErgChange: (value: boolean) => void;
    onGroupChange: (value: string) => void;
}

/** FTP -> ERG -> Group, always in this vertical order (never side-by-side). */
const SettingsColumn = ({
    ftp, useErgMode, groups, group, isScheduled, onFtpChange, onErgChange, onGroupChange,
}: SettingsColumnProps) => (
    <View>
        <View style={styles.settingsField}>
            <EditNumber label="FTP" unit="W" value={ftp} min={0} max={999} digits={0} onValueChange={onFtpChange} />
        </View>
        <View style={styles.settingsField}>
            <BinarySelect
                label="ERG Mode"
                labelPosition="before"
                labelWidth={100}
                value={useErgMode}
                trueLabel="On"
                falseLabel="Off"
                onValueChange={onErgChange}
            />
        </View>
        {!isScheduled && (
            <View style={styles.settingsField}>
                <GroupPicker label="Group" groups={groups} value={group} onValueChange={onGroupChange} />
            </View>
        )}
    </View>
);

interface GraphColumnProps {
    plan: WorkoutGraphPlan;
    graphHeight: number;
    scheduledLabel?: string;
    description?: string;
}

const GraphColumn = ({ plan, graphHeight, scheduledLabel, description }: GraphColumnProps) => (
    <View>
        {!!scheduledLabel && <Text style={styles.scheduledText}>{scheduledLabel}</Text>}
        <WorkoutGraph mode="detail" plan={plan} height={graphHeight} />
        {!!description && <Text style={styles.description}>{description}</Text>}
    </View>
);

export const WorkoutDetailsView = (props: WorkoutDetailsViewProps) => {
    const {
        title, description, duration, plan, compact,
        ftp, useErgMode, groups, group, isScheduled, scheduledLabel,
        canDelete, canStartWorkoutOnly,
        showDeleteConfirm, deleting,
        onClose, onSetFtp, onSetErgMode, onChangeGroup, onStart,
        onDeleteRequest, onDeleteConfirm, onDeleteCancel,
    } = props;

    const handleFtpChange = useCallback((value?: number) => {
        if (value !== undefined) onSetFtp(value);
    }, [onSetFtp]);

    const handleErgChange = useCallback((value: boolean) => {
        onSetErgMode(value);
    }, [onSetErgMode]);

    const handleGroupChange = useCallback((value: string) => {
        onChangeGroup(value);
    }, [onChangeGroup]);

    const dialogButtons = [
        { label: 'Close', onClick: onClose },
        ...(canDelete ? [{ label: 'Delete', onClick: onDeleteRequest }] : []),
        ...(canStartWorkoutOnly ? [{ label: 'Start', onClick: onStart, primary: true }] : []),
    ];

    // Web/desktop also shows total duration — folded into the title bar (rather than a
    // separate line) so it never costs vertical space, which matters most in compact mode.
    const dialogTitle = `${title} • ${duration}`;

    const settingsColumn = (
        <SettingsColumn
            ftp={ftp}
            useErgMode={useErgMode}
            groups={groups}
            group={group}
            isScheduled={isScheduled}
            onFtpChange={handleFtpChange}
            onErgChange={handleErgChange}
            onGroupChange={handleGroupChange}
        />
    );

    return (
        <Dialog title={dialogTitle} variant="full" buttons={dialogButtons} onOutsideClick={onClose}>
            {compact ? (
                <View style={styles.compactRoot}>
                    <View style={styles.compactLeft}>{settingsColumn}</View>
                    <View style={styles.compactRight}>
                        <GraphColumn
                            plan={plan}
                            graphHeight={GRAPH_HEIGHT_COMPACT}
                            scheduledLabel={scheduledLabel}
                            description={description}
                        />
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.graphContainer}>
                        <GraphColumn
                            plan={plan}
                            graphHeight={GRAPH_HEIGHT}
                            scheduledLabel={scheduledLabel}
                            description={description}
                        />
                    </View>
                    <View style={styles.settingsArea}>{settingsColumn}</View>
                </>
            )}

            {showDeleteConfirm && (
                <View style={styles.deleteConfirmWrapper}>
                    <Dialog
                        variant="info"
                        title="Delete Workout"
                        buttons={[
                            { label: 'No', onClick: onDeleteCancel, disabled: deleting },
                            { label: 'Yes', onClick: onDeleteConfirm, attention: true, disabled: deleting },
                        ]}
                        onOutsideClick={onDeleteCancel}
                    >
                        <Text style={styles.confirmText}>This will permanently delete this workout. Are you sure?</Text>
                    </Dialog>
                </View>
            )}
        </Dialog>
    );
};

const styles = StyleSheet.create({
    graphContainer: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    scheduledText: {
        color: colors.buttonPrimary,
        fontWeight: '700',
        fontSize: textSizes.smallText,
        paddingHorizontal: 5,
        paddingBottom: 4,
    },
    description: {
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingHorizontal: 5,
        paddingTop: 8,
    },
    settingsArea: {
        padding: 15,
    },
    settingsField: {
        marginBottom: 15,
    },
    compactRoot: {
        flexDirection: 'row',
        gap: 15,
        padding: 10,
    },
    compactLeft: {
        flex: 1,
    },
    compactRight: {
        flex: 1,
    },
    deleteConfirmWrapper: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    confirmText: {
        fontSize: textSizes.normalText,
        color: colors.text,
        padding: 16,
        textAlign: 'center',
    },
});
