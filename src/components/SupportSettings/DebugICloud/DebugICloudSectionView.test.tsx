import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DebugICloudSectionView } from './DebugICloudSectionView';

describe('DebugICloudSectionView', () => {
    const props = {
        onPickFolder: jest.fn(),
        onProbeNoGrant: jest.fn(),
        onProbeWithGrant: jest.fn(),
        onCaptureGrant: jest.fn(),
        onProbeCaptured: jest.fn(),
        onDownloadLargest: jest.fn(),
        onEvictLargest: jest.fn(),
        onReadControlFilePlain: jest.fn(),
        onOpenPickerAtLastFolder: jest.fn(),
        onIdentityToken: jest.fn(),
    };

    afterEach(() => jest.clearAllMocks());

    it('renders the section header and every button', () => {
        const { getByText } = render(<DebugICloudSectionView {...props} />);
        expect(getByText('Debug iCloud')).toBeTruthy();
        expect(getByText('Pick folder')).toBeTruthy();
        expect(getByText('Probe (no grant)')).toBeTruthy();
        expect(getByText('Probe (with grant)')).toBeTruthy();
        expect(getByText('Capture grant from path')).toBeTruthy();
        expect(getByText('Probe (captured grant only)')).toBeTruthy();
        expect(getByText('Download largest video')).toBeTruthy();
        expect(getByText('Evict largest video')).toBeTruthy();
        expect(getByText('Read first control file (plain)')).toBeTruthy();
        expect(getByText('Open picker at last folder')).toBeTruthy();
        expect(getByText('Identity token')).toBeTruthy();
    });

    it.each([
        ['Pick folder', 'onPickFolder'],
        ['Probe (no grant)', 'onProbeNoGrant'],
        ['Probe (with grant)', 'onProbeWithGrant'],
        ['Capture grant from path', 'onCaptureGrant'],
        ['Probe (captured grant only)', 'onProbeCaptured'],
        ['Download largest video', 'onDownloadLargest'],
        ['Evict largest video', 'onEvictLargest'],
        ['Read first control file (plain)', 'onReadControlFilePlain'],
        ['Open picker at last folder', 'onOpenPickerAtLastFolder'],
        ['Identity token', 'onIdentityToken'],
    ] as const)('tapping "%s" calls %s', (label, handlerName) => {
        const { getByText } = render(<DebugICloudSectionView {...props} />);
        fireEvent.press(getByText(label));
        expect((props as any)[handlerName]).toHaveBeenCalledTimes(1);
    });
});
