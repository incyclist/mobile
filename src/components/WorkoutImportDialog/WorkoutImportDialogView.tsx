import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { colors, textSizes } from '../../theme';
import { WorkoutImportDialogViewProps } from './types';
import { ResultGroupField } from './ResultGroupField';

/**
 * Pure view component for the Import Workout dialog.
 * Switches between phase content based on `displayProps.phase` — same
 * Dialog-in-view convention as `RouteImportDialogView`, but a simpler phase
 * set (`landing -> importing -> result | error`), single-file only. Landing
 * is file-pick only; the Group field appears on `result`, once the workout
 * has actually been parsed — deciding the group after seeing what was
 * imported is a more informed choice than deciding blind beforehand.
 */
export const WorkoutImportDialogView = ({
    compact,
    displayProps,
    title,
    buttons,
    onOutsideClick,
    onSetGroup,
    onPickFile,
}: WorkoutImportDialogViewProps) => {
    const { phase, knownGroups, importing, result, error } = displayProps;

    const renderContent = () => {
        switch (phase) {
            case 'landing':
                return (
                    <View style={[styles.container, compact && styles.containerCompact]}>
                        <TouchableOpacity
                            style={[styles.tile, compact && styles.tileCompact]}
                            onPress={onPickFile}
                        >
                            <View style={styles.iconContainer}>
                                <Icon name="import-route" size={compact ? 24 : 32} color={colors.icon} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.tileTitle, compact && styles.tileTitleCompact]}>
                                    Choose Workout File
                                </Text>
                                <Text style={[styles.tileSubtitle, compact && styles.tileSubtitleCompact]}>
                                    .zwo or .json
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                );

            case 'importing':
                return (
                    <View style={[styles.centerContainer, compact && styles.centerContainerCompact]}>
                        <ActivityIndicator size="large" color={colors.buttonPrimary} style={styles.spinner} />
                        <Text style={[styles.statusTitle, compact && styles.statusTitleCompact]}>
                            Importing {importing?.fileName ?? 'workout'}...
                        </Text>
                    </View>
                );

            case 'result':
                return (
                    <View style={[styles.centerContainer, compact && styles.centerContainerCompact]}>
                        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { borderColor: colors.success }]}>
                            <Icon name="import-route" size={compact ? 28 : 64} color={colors.success} />
                        </View>
                        <Text style={[styles.statusTitle, compact && styles.statusTitleCompact]}>
                            Import Successful
                        </Text>
                        <Text style={[styles.statusMessage, compact && styles.statusMessageCompact]}>
                            {result
                                ? `"${result.workoutName}" has been added to your library.`
                                : 'The workout has been added to your library.'}
                        </Text>
                        {result && (
                            <View style={styles.groupFieldContainer}>
                                <ResultGroupField
                                    label="Group"
                                    groups={knownGroups}
                                    value={result.group}
                                    onValueChange={onSetGroup}
                                />
                            </View>
                        )}
                    </View>
                );

            case 'error':
                return (
                    <View style={[styles.centerContainer, compact && styles.centerContainerCompact]}>
                        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { borderColor: colors.error }]}>
                            <Icon name="funnel" size={compact ? 28 : 64} color={colors.error} />
                        </View>
                        <Text style={[styles.statusTitle, compact && styles.statusTitleCompact]}>
                            Import Failed
                        </Text>
                        <Text style={[styles.statusMessage, compact && styles.statusMessageCompact]}>
                            {error || 'An unexpected error occurred during import.'}
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog
            title={title}
            visible={true}
            onOutsideClick={onOutsideClick}
            variant="full"
            buttons={buttons}
        >
            <View style={styles.body}>{renderContent()}</View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    body: {
        // Leave empty as per RouteImportDialogView convention
    },
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    containerCompact: {
        padding: 10,
    },
    tile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        padding: 16,
    },
    tileCompact: {
        padding: 12,
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    tileTitle: {
        fontSize: textSizes.listEntry,
        color: colors.text,
        fontWeight: '700',
    },
    tileTitleCompact: {
        fontSize: textSizes.normalText,
    },
    tileSubtitle: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
        marginTop: 2,
    },
    tileSubtitleCompact: {
        fontSize: textSizes.smallText,
    },
    centerContainer: {
        padding: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
    },
    centerContainerCompact: {
        padding: 10,
        minHeight: 160,
    },
    spinner: {
        marginBottom: 24,
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
    statusTitle: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    statusTitleCompact: {
        fontSize: textSizes.listEntry,
        marginBottom: 4,
    },
    statusMessage: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    statusMessageCompact: {
        fontSize: textSizes.smallText,
        paddingHorizontal: 10,
    },
    groupFieldContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 8,
    },
});
