import React from 'react';
import { render } from '@testing-library/react-native';
import { OperationsSelector } from './OperationsSelector';
import { OperationsSelectorProps } from './types';

jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
        logError: jest.fn(),
    }),
}));

const MOCK_PROPS: OperationsSelectorProps = {
    operations: [
        { operation: 'ActivityUpload', enabled: true },
        { operation: 'RouteDownload', enabled: false },
    ],
    onChanged: jest.fn(),
};

describe('OperationsSelector', () => {
    it('renders in normal layout', () => {
        render(<OperationsSelector {...MOCK_PROPS} />);
    });

    it('renders in compact layout', () => {
        render(<OperationsSelector {...MOCK_PROPS} compact />);
    });

    it('renders with operations={undefined} without crashing', () => {
        render(<OperationsSelector operations={undefined} />);
    });

    it('renders with empty operations={[]} without crashing', () => {
        render(<OperationsSelector operations={[]} />);
    });
});