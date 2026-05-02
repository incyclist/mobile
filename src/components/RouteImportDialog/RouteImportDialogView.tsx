import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RouteImportDialogViewProps } from './types';
import { LandingView } from './views/LandingView';
import { ScanningView } from './views/ScanningView';
import { ParseSelectionView } from './views/ParseSelectionView';
import { IngestingView } from './views/IngestingView';
import { CompleteView } from './views/CompleteView';
import { ResultView } from './views/ResultView';
import { SingleImportingView } from './views/SingleImportingView';
import { Dialog } from '../Dialog';

/**
 * Pure view component for the Import Routes dialog.
 * Switches between sub-views based on the current import phase.
 */
export const RouteImportDialogView = ({
    compact,
    displayProps,
    selectedIds,
    isSingleImporting,
    title,
    buttons,
    onOutsideClick,
    onAddGpx,
    onAddVideoRoute,
    onSelectFolder,
    onToggleRoute,
    onSelectAll,
    onDeselectAll,
}: RouteImportDialogViewProps) => {
    const {
        phase,
        scanProgress,
        parseProgress,
        ingestProgress,
        routes,
        completionSummary,
        resultSuccess,
        error,
    } = displayProps;

    const renderContent = () => {
        if (isSingleImporting) {
            return <SingleImportingView compact={compact} />;
        }
        switch (phase) {
            case 'landing':
                return (
                    <LandingView
                        compact={compact}
                        onAddGpx={onAddGpx}
                        onAddVideoRoute={onAddVideoRoute}
                        onSelectFolder={onSelectFolder}
                    />
                );

            case 'scanning':
                return (
                    <ScanningView
                        compact={compact}
                        scannedFolders={scanProgress?.scannedFolders ?? 0}
                    />
                );

            case 'parsing':
            case 'selecting':
                return (
                    <ParseSelectionView
                        compact={compact}
                        routes={routes}
                        parseProgress={phase === 'parsing' ? parseProgress : undefined}
                        selectedIds={selectedIds}
                        onToggle={onToggleRoute}
                        onSelectAll={onSelectAll}
                        onDeselectAll={onDeselectAll}
                    />
                );

            case 'ingesting':
                return (
                    <IngestingView
                        compact={compact}
                        current={ingestProgress?.current ?? 0}
                        total={ingestProgress?.total ?? 0}
                        currentName={ingestProgress?.currentName ?? ''}
                        errorCount={0}
                    />
                );

            case 'complete':
                return (
                    <CompleteView
                        compact={compact}
                        imported={completionSummary?.imported ?? 0}
                        skipped={completionSummary?.skipped ?? 0}
                        errors={completionSummary?.errors ?? 0}
                        failedRoutes={completionSummary?.failedRoutes ?? []}
                    />
                );

            case 'result':
                return (
                    <ResultView
                        compact={compact}
                        success={resultSuccess != null}
                        routeName={resultSuccess?.routeName}
                        error={error}
                    />
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
            variant="details"
            buttons={buttons}
        >
            <View style={styles.container}>
                {renderContent()}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        // Leave empty as per requirements
    },
});