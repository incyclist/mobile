import React from 'react';
import { colors } from '../../../theme';
import { StatusPanel } from './StatusPanel';

interface ErrorViewProps {
    compact: boolean;
    error?: string;
}

export const ErrorView = ({ compact, error }: ErrorViewProps) => (
    <StatusPanel
        compact={compact}
        icon="funnel"
        iconColor={colors.error}
        title="Import Failed"
        message={error || 'An unexpected error occurred during import.'}
    />
);
