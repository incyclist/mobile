import React from 'react';
import { render } from '@testing-library/react-native';
import { ScanningView } from './ScanningView';

describe('ScanningView', () => {
    it('renders folder count correctly', () => {
        const { getByText } = render(
            <ScanningView compact={false} scannedFolders={15} />
        );
        expect(getByText('Folders scanned: 15')).toBeTruthy();
    });

    it('renders in compact mode without crashing', () => {
        render(<ScanningView compact={true} scannedFolders={5} />);
    });
});