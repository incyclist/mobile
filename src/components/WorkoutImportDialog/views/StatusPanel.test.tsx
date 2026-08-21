import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { StatusPanel } from './StatusPanel';
import { colors } from '../../../theme';

describe('StatusPanel', () => {
    it('renders the icon, title and message', () => {
        const { getByText } = render(
            <StatusPanel compact={false} icon="funnel" iconColor={colors.error} title="Import Failed" message="Something went wrong." />
        );
        expect(getByText('Import Failed')).toBeTruthy();
        expect(getByText('Something went wrong.')).toBeTruthy();
    });

    it('renders correctly in compact mode', () => {
        render(
            <StatusPanel compact={true} icon="funnel" iconColor={colors.error} title="Import Failed" message="Something went wrong." />
        );
    });

    it('renders extra children below the message', () => {
        const { getByText } = render(
            <StatusPanel compact={false} icon="import-route" iconColor={colors.success} title="Import Successful" message="Done.">
                <Text>Extra content</Text>
            </StatusPanel>
        );
        expect(getByText('Extra content')).toBeTruthy();
    });
});
