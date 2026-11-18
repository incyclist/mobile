import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SupportSettingsView } from './SupportSettingsView';
import { SUPPORT_DIRECT_PROPS, SUPPORT_WEBSITE_PROPS } from './SupportSettings.mock';

jest.mock('../../hooks', () => ({
    ...jest.requireActual('../../hooks'),
    useScreenLayout: jest.fn(() => 'normal'),
}));

describe('SupportSettingsView', () => {
    const defaultProps = {
        displayProps: SUPPORT_DIRECT_PROPS,
        compact: false,
        onClose: jest.fn(),
        onShareUuid: jest.fn(),
        onOpenUrl: jest.fn(),
        onDonate: jest.fn(),
        onShareDetails: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders direct mode with both payment buttons', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        expect(getByText('Support')).toBeTruthy();
        expect(getByText('1.2.3')).toBeTruthy();
        expect(getByText('PayPal')).toBeTruthy();
        expect(getByText('GitHub Sponsors')).toBeTruthy();
    });

    it('renders website mode with a single link and no payment buttons', () => {
        const { getByText, queryByText } = render(
            <SupportSettingsView {...defaultProps} displayProps={SUPPORT_WEBSITE_PROPS} />
        );
        expect(getByText('Ways to support Incyclist')).toBeTruthy();
        expect(getByText('incyclist.com')).toBeTruthy();
        expect(queryByText('PayPal')).toBeNull();
    });

    it('renders with displayProps={null} without crashing', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} displayProps={null} />);
        expect(getByText('Support')).toBeTruthy();
    });

    it('tapping Close calls onClose', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('Close'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('tapping Share calls onShareUuid', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('Share'));
        expect(defaultProps.onShareUuid).toHaveBeenCalled();
    });

    it('tapping privacy calls onOpenUrl with the privacy id', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('Privacy Policy'));
        expect(defaultProps.onOpenUrl).toHaveBeenCalledWith('https://incyclist.com/privacy', 'privacy');
    });

    describe('tablet', () => {
        it('tapping the email address calls onOpenUrl with the email link', () => {
            const { getByText } = render(<SupportSettingsView {...defaultProps} />);
            fireEvent.press(getByText('support@incyclist.com'));
            expect(defaultProps.onOpenUrl).toHaveBeenCalledWith(expect.stringContaining('mailto:'), 'email');
        });

        it('tapping Share details calls onShareDetails', () => {
            const { getByText } = render(<SupportSettingsView {...defaultProps} />);
            fireEvent.press(getByText('Share details'));
            expect(defaultProps.onShareDetails).toHaveBeenCalled();
        });
    });

    it('renders labels from the service display props', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        expect(getByText('App version')).toBeTruthy();
        expect(getByText('UI version')).toBeTruthy();
        expect(getByText('UUID')).toBeTruthy();
    });

    it('tapping the GitHub link calls onOpenUrl with the github id', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('GitHub'));
        expect(defaultProps.onOpenUrl).toHaveBeenCalledWith('https://github.com/incyclist', 'github');
    });

    describe('phone', () => {
        const phoneProps = { ...defaultProps, compact: true };

        it('shows the compact version text from the service', () => {
            const { getByText } = render(<SupportSettingsView {...phoneProps} />);
            expect(getByText('Version: App 1.2.3 · UI 26.10.1')).toBeTruthy();
        });

        it('shows the need-help links as chips, without Share details', () => {
            const { getByText, queryByText } = render(<SupportSettingsView {...phoneProps} />);
            expect(getByText('Strava club')).toBeTruthy();
            expect(getByText('Slack')).toBeTruthy();
            expect(getByText('Email')).toBeTruthy();
            expect(queryByText('Share details')).toBeNull();
        });

        it('tapping the Email chip calls onOpenUrl with the email link', () => {
            const { getByText } = render(<SupportSettingsView {...phoneProps} />);
            fireEvent.press(getByText('Email'));
            expect(defaultProps.onOpenUrl).toHaveBeenCalledWith(expect.stringContaining('mailto:'), 'email');
        });
    });

    it('tapping PayPal calls onDonate with the channel', () => {
        const { getByText } = render(<SupportSettingsView {...defaultProps} />);
        fireEvent.press(getByText('PayPal'));
        expect(defaultProps.onDonate).toHaveBeenCalledWith('paypal', 'https://www.paypal.com/paypalme/incyclist');
    });

    it('tapping the website link calls onDonate with website', () => {
        const { getByText } = render(
            <SupportSettingsView {...defaultProps} displayProps={SUPPORT_WEBSITE_PROPS} />
        );
        fireEvent.press(getByText('Ways to support Incyclist'));
        expect(defaultProps.onDonate).toHaveBeenCalledWith('website', 'https://incyclist.com/#support');
    });
});
