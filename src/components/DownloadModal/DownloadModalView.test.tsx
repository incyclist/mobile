import React from 'react';
import { render } from '@testing-library/react-native';
import { DownloadModalView } from './DownloadModalView';
import { DownloadModalViewProps, DownloadRowDisplayProps } from './types';

const MOCK_ROWS: DownloadRowDisplayProps[] = [
    { routeId: 'r1', title: 'Laon – Paris', status: 'downloading', pct: 62, speed: '2.1 MB/s', sizeLabel: '3.1 / 5.0 GB' },
    { routeId: 'r2', title: 'Col du Tourmalet', status: 'done' },
    { routeId: 'r3', title: 'Alpe d\'Huez', status: 'failed' },
    { routeId: 'r4', title: 'Mont Ventoux', status: 'required' },
];

const MOCK_PROPS: DownloadModalViewProps = {
    visible: true,
    rows: MOCK_ROWS,
    onStop: jest.fn(),
    onRetry: jest.fn(),
    onDelete: jest.fn(),
    onClose: jest.fn(),
};

describe('DownloadModalView', () => {
    it('renders correctly when visible', () => {
        render(<DownloadModalView {...MOCK_PROPS} />);
    });

    it('renders correctly when hidden', () => {
        render(<DownloadModalView {...MOCK_PROPS} visible={false} />);
    });

    it('renders empty state correctly', () => {
        render(<DownloadModalView {...MOCK_PROPS} rows={[]} />);
    });

    it('renders downloading row correctly', () => {
        render(<DownloadModalView {...MOCK_PROPS} rows={[MOCK_ROWS[0]]} />);
    });

    it('renders done row correctly', () => {
        render(<DownloadModalView {...MOCK_PROPS} rows={[MOCK_ROWS[1]]} />);
    });

    it('renders failed row correctly', () => {
        render(<DownloadModalView {...MOCK_PROPS} rows={[MOCK_ROWS[2]]} />);
    });

    it('renders required row correctly', () => {
        render(<DownloadModalView {...MOCK_PROPS} rows={[MOCK_ROWS[3]]} />);
    });
});