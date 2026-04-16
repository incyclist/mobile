import React from 'react';
import { render } from '@testing-library/react-native';
import { DownloadModalView } from './DownloadModalView';
import { DownloadRowDisplayProps } from 'incyclist-services';

const MOCK_ROWS: DownloadRowDisplayProps[] = [
    { routeId: 'r1', title: 'Laon – Paris', status: 'downloading', pct: 62 },
    { routeId: 'r2', title: 'Col du Tourmalet', status: 'done' },
    { routeId: 'r3', title: "Alpe d'Huez", status: 'failed' },
    { routeId: 'r4', title: 'Mont Ventoux', status: 'required' },
];

const MOCK_PROPS = {
    visible: true,
    rows: MOCK_ROWS,
    onStop: jest.fn(),
    onRetry: jest.fn(),
    onDelete: jest.fn(),
    onClose: jest.fn(),
};

describe('DownloadModalView', () => {
    it('renders correctly when visible', () => {
        const { getByText } = render(<DownloadModalView {...MOCK_PROPS} />);
        expect(getByText('Laon – Paris')).toBeTruthy();
        expect(getByText('Saved for offline riding')).toBeTruthy();
        expect(getByText('Download failed')).toBeTruthy();
        expect(getByText('Download required to ride')).toBeTruthy();
    });

    it('renders empty state when rows are empty', () => {
        const { getByText } = render(<DownloadModalView {...MOCK_PROPS} rows={[]} />);
        expect(getByText('No downloads')).toBeTruthy();
    });

    it('does not render when not visible', () => {
        const { queryByText } = render(<DownloadModalView {...MOCK_PROPS} visible={false} />);
        expect(queryByText('Downloads')).toBeNull();
    });
});