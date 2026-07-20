import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog } from '../Dialog';
import { WorkoutImportDialogViewProps } from './types';
import { LandingView } from './views/LandingView';
import { ImportingView } from './views/ImportingView';
import { ResultView } from './views/ResultView';
import { ErrorView } from './views/ErrorView';

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
                return <LandingView compact={compact} onPickFile={onPickFile} />;

            case 'importing':
                return <ImportingView compact={compact} fileName={importing?.fileName} />;

            case 'result':
                return (
                    <ResultView
                        compact={compact}
                        workoutName={result?.workoutName}
                        group={result?.group}
                        knownGroups={knownGroups}
                        onSetGroup={onSetGroup}
                    />
                );

            case 'error':
                return <ErrorView compact={compact} error={error} />;

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
});
