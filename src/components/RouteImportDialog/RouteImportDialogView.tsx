import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog } from '../Dialog';
import { RouteImportDialogViewProps } from './types';
import { LandingView } from './views/LandingView';
import { ScanningView } from './views/ScanningView';
import { ParseSelectionView } from './views/ParseSelectionView';
import { IngestingView } from './views/IngestingView';
import { CompleteView } from './views/CompleteView';
import { ResultView } from './views/ResultView';

export const RouteImportDialogView = (props: RouteImportDialogViewProps) => {
    const {
        title,
        buttons,
        onOutsideClick,
        displayProps,
        selectedIds,
        onAddGpx,
        onAddVideoRoute,
        onSelectFolder,
        onToggleRoute,
        onSelectAll,
        onDeselectAll,
    } = props;

    const renderContent = () => {
        switch (displayProps.phase) {
            case 'landing':
                return (
                    <LandingView
                        onAddGpx={onAddGpx}
                        onAddVideoRoute={onAddVideoRoute}
                        onSelectFolder={onSelectFolder}
                    />
                );
            case 'scanning':
                return <ScanningView statusText={displayProps.statusText ?? 'Scanning...'} />;
            case 'parsing':
            case 'selecting':
                return (
                    <ParseSelectionView
                        displayProps={displayProps}
                        selectedIds={selectedIds}
                        onToggleRoute={onToggleRoute}
                        onSelectAll={onSelectAll}
                        onDeselectAll={onDeselectAll}
                    />
                );
            case 'ingesting':
                return (
                    <IngestingView
                        progress={displayProps.progress ?? 0}
                        statusText={displayProps.statusText ?? 'Importing...'}
                    />
                );
            case 'complete':
                return <CompleteView count={displayProps.routes?.length ?? 0} />;
            case 'result':
                return (
                    <ResultView
                        success={displayProps.resultSuccess ?? false}
                        message={displayProps.resultMessage ?? ''}
                        errorDetails={displayProps.resultError}
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
        // flex: 1 removed to allow Dialog scroll to handle content
    },
});