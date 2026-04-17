import React from 'react';
import { render } from '@testing-library/react-native';
import { DownloadPill } from './DownloadPill';

const MOCK_PROPS = {
    activeDownloadCount: 2,
    onPress: jest.fn(),
};

describe('DownloadPill', () => {
    it('renders without crashing', () => {
        render(<DownloadPill {...MOCK_PROPS} />);
    });
});