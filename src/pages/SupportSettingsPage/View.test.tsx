import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SupportSettingsView } from './View';
import { SupportSettingsDisplayProps } from 'incyclist-services';

const MOCK_DISPLAY_PROPS: SupportSettingsDisplayProps = {
    uuid: '1b4ff3d2-f602-4cc5-9d7b-a9f9444e5797',
    appVersion: '0.9.14',
    uiVersion: '26.3.6',
    privacyUrl: 'https://incyclist.com/privacy',
    supportUrls: [
        { label: 'Slack', text: 'Incyclist Slack Workspace', url: 'https://slack.incyclist.com' },
    ],
    gitHubUrl: 'https://github.com/incyclist',
    donationUrl: 'https://www.paypal.com/paypalme/incyclist',
};

describe('SupportSettingsView', () => {
    const defaultProps = {
        displayProps: MOCK_DISPLAY_PROPS,
        onBack: jest.fn(),
        onShareUuid: jest.fn(),
        onOpenUrl: jest.fn(),
    };

    it('renders with full display props', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        expect(getByText('Support')).toBeTruthy();
        expect(getByText('0.9.14')).toBeTruthy();
        expect(getByText('1b4ff3d2-f602-4cc5-9d7b-a9f9444e5797')).toBeTruthy();
        expect(getByText('Incyclist Slack Workspace')).toBeTruthy();
    });

    it('renders with displayProps={null} without crashing', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} displayProps={null} />);
        expect(getByText('Support')).toBeTruthy();
    });

    it('tapping back calls onBack', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('‹'));
        expect(defaultProps.onBack).toHaveBeenCalled();
    });

    it('tapping Share UUID calls onShareUuid', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('Share'));
        expect(defaultProps.onShareUuid).toHaveBeenCalled();
    });

    it('tapping a support URL calls onOpenUrl with the correct URL', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('Incyclist Slack Workspace'));
        expect(defaultProps.onOpenUrl).toHaveBeenCalledWith('https://slack.incyclist.com');
    });

    it('tapping privacy calls onOpenUrl with privacyUrl', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('Privacy Policy'));
        expect(defaultProps.onOpenUrl).toHaveBeenCalledWith(MOCK_DISPLAY_PROPS.privacyUrl);
    });
});