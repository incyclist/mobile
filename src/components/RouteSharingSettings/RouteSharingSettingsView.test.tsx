import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RouteSharingSettingsView } from './RouteSharingSettingsView';
import type { RouteSharingSettingsViewProps } from './types';
import { ALL_ROWS, MOCK_NOW, NOT_REACHABLE, REACHABLE } from './RouteSharingSettings.mock';
import { formatWhen } from './utils';

const baseProps = (): RouteSharingSettingsViewProps => ({
    mode: 'list',
    rows: ALL_ROWS,
    checking: false,
    searchBlocked: false,
    platform: 'ios',
    now: MOCK_NOW,
    compact: true,
    onClose: jest.fn(),
    onCheckAgain: jest.fn(),
    onAddComputer: jest.fn(),
    onRename: jest.fn(),
    onForget: jest.fn(),
    onOpenIosSettings: jest.fn(),
    onOpenStore: jest.fn(),
});

describe('RouteSharingSettingsView', () => {
    it('renders every row state with its status line', () => {
        const { getByText } = render(<RouteSharingSettingsView {...baseProps()} />);
        expect(getByText('Connected • 42 routes')).toBeTruthy();
        expect(getByText('Adding routes…')).toBeTruthy();
        expect(getByText('Not reachable • last seen 3 hours ago')).toBeTruthy();
        expect(getByText('Not reached yet')).toBeTruthy();
        expect(getByText('Checking…')).toBeTruthy();
        expect(getByText('Update Incyclist on this computer')).toBeTruthy();
    });

    it('renders the empty state, with the iOS line only on iOS', () => {
        const props = { ...baseProps(), mode: 'empty' as const, rows: [] };
        const ios = render(<RouteSharingSettingsView {...props} />);
        expect(ios.getByText('If your device asks to find devices on your network, tap Allow.')).toBeTruthy();
        ios.unmount();

        const android = render(<RouteSharingSettingsView {...props} platform="android" />);
        expect(android.queryByText('If your device asks to find devices on your network, tap Allow.')).toBeNull();
    });

    it('renders only the update prompt when the app is too old, with the store of the platform', () => {
        const props = { ...baseProps(), mode: 'unsupported' as const, rows: [], platform: 'android' as const };
        const { getByText, queryByText } = render(<RouteSharingSettingsView {...props} />);
        expect(getByText('Update Incyclist to use Route Sharing')).toBeTruthy();
        expect(getByText(/from the Play Store/)).toBeTruthy();
        expect(queryByText('Add Computer')).toBeNull();
        fireEvent.press(getByText('Open Play Store'));
        expect(props.onOpenStore).toHaveBeenCalled();
    });

    it('expands a not reachable row to the checklist, with the iOS hint only if never reached', () => {
        const props = { ...baseProps(), rows: [NOT_REACHABLE, { ...NOT_REACHABLE, linkId: 'x', name: 'Other', reachability: 'never-reached' as const }] };
        const { getByText, queryByText } = render(<RouteSharingSettingsView {...props} />);
        fireEvent.press(getByText('Basement Mac'));
        expect(getByText("Can't reach Basement Mac?")).toBeTruthy();
        expect(queryByText('Open iOS Settings')).toBeNull();

        fireEvent.press(getByText('Other'));
        expect(getByText('Open iOS Settings')).toBeTruthy();
    });

    it('shows the sharing summary for a reachable row', () => {
        const { getByText } = render(<RouteSharingSettingsView {...baseProps()} rows={[REACHABLE]} />);
        fireEvent.press(getByText('Home PC'));
        expect(getByText('Sharing 42 routes • 5 of them are on this device')).toBeTruthy();
        expect(getByText('Last connected: 1 minute ago')).toBeTruthy();
    });

    it('confirms before forgetting a computer', () => {
        const props = { ...baseProps(), rows: [REACHABLE] };
        const { getByText, getAllByText } = render(<RouteSharingSettingsView {...props} />);
        fireEvent.press(getByText('Home PC'));
        fireEvent.press(getByText('Forget'));
        expect(props.onForget).not.toHaveBeenCalled();
        expect(getByText('Forget Home PC?')).toBeTruthy();
        fireEvent.press(getAllByText('Forget')[1]);
        expect(props.onForget).toHaveBeenCalledWith('link-1');
    });

    it('saves a new name', () => {
        const props = { ...baseProps(), rows: [REACHABLE] };
        const { getByText, getByLabelText } = render(<RouteSharingSettingsView {...props} />);
        fireEvent.press(getByText('Home PC'));
        fireEvent.press(getByText('Rename'));
        fireEvent.changeText(getByLabelText('Name on this device'), ' Living room ');
        fireEvent.press(getByText('Save'));
        expect(props.onRename).toHaveBeenCalledWith('link-1', 'Living room');
    });

    it('disables Check Again while checking and shows the blocked notice', () => {
        const props = { ...baseProps(), checking: true, searchBlocked: true };
        const { getAllByText, getByText } = render(<RouteSharingSettingsView {...props} />);
        fireEvent.press(getAllByText('Checking…').at(-1)!);
        expect(props.onCheckAgain).not.toHaveBeenCalled();
        expect(getByText(/Incyclist is busy looking for your trainer or sensors/)).toBeTruthy();
    });

    it('calls the footer actions', () => {
        const props = baseProps();
        const { getByText } = render(<RouteSharingSettingsView {...props} />);
        fireEvent.press(getByText('Check Again'));
        fireEvent.press(getByText('Add Computer'));
        fireEvent.press(getByText('Close'));
        expect(props.onCheckAgain).toHaveBeenCalled();
        expect(props.onAddComputer).toHaveBeenCalled();
        expect(props.onClose).toHaveBeenCalled();
    });
});

describe('formatWhen', () => {
    it.each([
        [0, 'just now'],
        [5 * 60 * 1000, '5 minutes ago'],
        [60 * 60 * 1000, '1 hour ago'],
        [30 * 60 * 60 * 1000, 'yesterday'],
        [4 * 24 * 60 * 60 * 1000, '4 days ago'],
    ])('%d ms ago reads "%s"', (diff, text) => {
        expect(formatWhen(MOCK_NOW - diff, MOCK_NOW)).toBe(text);
    });

    it('never seen reads "never"', () => {
        expect(formatWhen(undefined, MOCK_NOW)).toBe('never');
    });
});
