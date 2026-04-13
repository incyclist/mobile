import React from 'react';
import { render } from '@testing-library/react-native';
import { UploadPill } from './UploadPill';
import { UploadPillProps } from './types';

jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
        logError: jest.fn(),
    }),
}));

const MOCK_SUCCESS: UploadPillProps = {
    type: 'strava', text: 'Strava', status: 'success',
    url: 'https://strava.com/activities/123',
    onSynchronize: jest.fn(), onOpen: jest.fn(),
};
const MOCK_FAILED: UploadPillProps = {
    type: 'strava', text: 'Strava', status: 'failed',
    onSynchronize: jest.fn(), onOpen: jest.fn(),
};
const MOCK_UNKNOWN: UploadPillProps = {
    type: 'strava', text: 'Strava', status: 'unknown',
    onSynchronize: jest.fn(), onOpen: jest.fn(),
};
const MOCK_SYNCING: UploadPillProps = {
    type: 'strava', text: 'Strava', status: 'unknown',
    synchronizing: true, onSynchronize: jest.fn(), onOpen: jest.fn(),
};

describe('UploadPill', () => {
    it('renders success state without crashing', () => {
        render(<UploadPill {...MOCK_SUCCESS} />);
    });

    it('renders failed state without crashing', () => {
        render(<UploadPill {...MOCK_FAILED} />);
    });

    it('renders unknown state without crashing', () => {
        render(<UploadPill {...MOCK_UNKNOWN} />);
    });

    it('renders synchronizing state without crashing', () => {
        render(<UploadPill {...MOCK_SYNCING} />);
    });
});