import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddComputerDialogView } from './AddComputerDialogView';
import type { AddComputerDialogViewProps } from './types';
import * as mock from './AddComputerDialog.mock';
import { getFailureMessage, getWrongCodeMessage, secondsLeft } from './utils';

const baseProps = (): AddComputerDialogViewProps => ({
    discovery: mock.SEARCHING,
    pairing: mock.IDLE_PAIRING,
    now: 1000,
    compact: true,
    onCancel: jest.fn(),
    onSearchAgain: jest.fn(),
    onSelect: jest.fn(),
    onSubmitCode: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
    onOpenIosSettings: jest.fn(),
    onCheckAgain: jest.fn(),
    onDone: jest.fn(),
});

describe('AddComputerDialogView', () => {
    it('A-0: shows the busy message, never the none-found checklist', () => {
        const props = { ...baseProps(), discovery: mock.BLOCKED };
        const { getByText, queryByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText("Can't search right now")).toBeTruthy();
        expect(queryByText('No computers found')).toBeNull();
        fireEvent.press(getByText('Try Again'));
        expect(props.onSearchAgain).toHaveBeenCalled();
    });

    it('A-1: shows the prerequisite and the results, and selects a computer', () => {
        const props = { ...baseProps(), discovery: mock.SEARCHING_WITH_RESULTS };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText('Looking for computers on your Wi‑Fi…')).toBeTruthy();
        expect(getByText('On the computer, Settings › Routes › Route Sharing › Connect your phone or tablet must be open.')).toBeTruthy();
        expect(getByText('✓ Already connected')).toBeTruthy();
        fireEvent.press(getByText('Home PC'));
        expect(props.onSelect).toHaveBeenCalledWith(mock.HOME_PC.id);
    });

    it('A-1: shows the suffix of same-named computers and Search Again once the search ended', () => {
        const props = { ...baseProps(), discovery: mock.DONE_WITH_RESULTS };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText('Home PC (K3F9)')).toBeTruthy();
        fireEvent.press(getByText('Search Again'));
        expect(props.onSearchAgain).toHaveBeenCalled();
    });

    it('A-2: shows the iOS item and button only when the service asks for it', () => {
        const plain = render(<AddComputerDialogView {...baseProps()} discovery={mock.NONE_FOUND} />);
        expect(plain.getByText('No computers found')).toBeTruthy();
        expect(plain.queryByText('Open iOS Settings')).toBeNull();
        plain.unmount();

        const props = { ...baseProps(), discovery: mock.NONE_FOUND_IOS };
        const ios = render(<AddComputerDialogView {...props} />);
        fireEvent.press(ios.getByText('Open iOS Settings'));
        expect(props.onOpenIosSettings).toHaveBeenCalled();
    });

    it('A-3: not ready retries on the cached address', () => {
        const props = { ...baseProps(), pairing: mock.NOT_READY };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText("Home PC isn't ready to connect")).toBeTruthy();
        fireEvent.press(getByText('Try Again'));
        expect(props.onRetry).toHaveBeenCalled();
        fireEvent.press(getByText('Back'));
        expect(props.onBack).toHaveBeenCalled();
    });

    it('A-4: submits on the sixth digit, Cancel in the header on a phone', () => {
        const props = { ...baseProps(), pairing: mock.CODE };
        const { getByText, getByLabelText, queryAllByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText('Enter the 6‑digit code shown on Home PC.')).toBeTruthy();
        expect(queryAllByText('Cancel')).toHaveLength(1);
        const input = getByLabelText('6-digit code');
        fireEvent.changeText(input, '12345');
        expect(props.onSubmitCode).not.toHaveBeenCalled();
        fireEvent.changeText(input, '123456');
        expect(props.onSubmitCode).toHaveBeenCalledWith('123456');
        fireEvent.press(getByText('No code on that screen?'));
        expect(props.onBack).toHaveBeenCalled();
    });

    it('A-4: a wrong code shows the tries left', () => {
        const { getByText } = render(<AddComputerDialogView {...baseProps()} pairing={mock.CODE_LAST_TRY} />);
        expect(getByText("That code doesn't match. 1 try left.")).toBeTruthy();
    });

    it('failure outcomes offer their recovery', () => {
        const expired = baseProps();
        const a = render(<AddComputerDialogView {...expired} pairing={mock.failed('expired', 'get-new-code')} />);
        expect(a.getByText('That code has expired.')).toBeTruthy();
        fireEvent.press(a.getByText('Get a new code'));
        expect(expired.onRetry).toHaveBeenCalled();
        a.unmount();

        const denied = baseProps();
        const b = render(<AddComputerDialogView {...denied} pairing={mock.failed('denied', 'back')} />);
        expect(b.getByText('Home PC turned down the request.')).toBeTruthy();
        expect(b.queryByText('Try Again')).toBeNull();
    });

    it('rate limited: the retry is disabled and counts down', () => {
        const props = { ...baseProps(), pairing: mock.failed('rate-limited', 'try-again', 31_000) };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText('Too many tries. You can try again in 30 seconds.')).toBeTruthy();
        fireEvent.press(getByText('Try Again (30)'));
        expect(props.onRetry).not.toHaveBeenCalled();
    });

    it('A-5: Done passes the name on this device', () => {
        const props = { ...baseProps(), pairing: mock.CONNECTED, syncState: 'syncing' as const };
        const { getByText, getByLabelText } = render(<AddComputerDialogView {...props} />);
        expect(getByText('Adding routes from Home PC…')).toBeTruthy();
        fireEvent.changeText(getByLabelText('Name on this device'), 'Living room');
        fireEvent.press(getByText('Done'));
        expect(props.onDone).toHaveBeenCalledWith('Living room');
    });

    it('A-5: Done passes the computer name if it was not edited', () => {
        const props = { ...baseProps(), pairing: mock.CONNECTED };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        fireEvent.press(getByText('Done'));
        expect(props.onDone).toHaveBeenCalledWith('Home PC');
    });

    it('A-5: a computer that shares nothing', () => {
        const props = { ...baseProps(), pairing: mock.CONNECTED, routeCount: 0, syncState: 'done' as const };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText(/It isn't sharing any routes yet/)).toBeTruthy();
    });

    it('A-5: only says Adding routes while the service is syncing', () => {
        const idle = render(<AddComputerDialogView {...baseProps()} pairing={mock.CONNECTED} />);
        expect(idle.queryByText(/Adding routes/)).toBeNull();
        expect(idle.getByText('Connected to Home PC.')).toBeTruthy();
        idle.unmount();
        const done = render(<AddComputerDialogView {...baseProps()} pairing={mock.CONNECTED} syncState="done" routeCount={18} />);
        expect(done.queryByText(/Adding routes/)).toBeNull();
        expect(done.getByText('Connected • 18 routes')).toBeTruthy();
    });

    it('A-5: a failed sync says so and offers Check Again, Done stays available', () => {
        const props = { ...baseProps(), pairing: mock.CONNECTED, syncState: 'failed' as const };
        const { getByText, queryByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText(/the routes could not be loaded/)).toBeTruthy();
        expect(queryByText(/Adding routes/)).toBeNull();
        fireEvent.press(getByText('Check Again'));
        expect(props.onCheckAgain).toHaveBeenCalled();
        fireEvent.press(getByText('Done'));
        expect(props.onDone).toHaveBeenCalled();
    });

    it('A-5: media that cannot be loaded on this device', () => {
        const props = { ...baseProps(), pairing: mock.CONNECTED, syncState: 'media-unavailable' as const };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        expect(getByText(/This device cannot load routes from your computer yet\./)).toBeTruthy();
        expect(getByText('Check Again')).toBeTruthy();
    });

    it('A-6: already connected', () => {
        const { getByText } = render(<AddComputerDialogView {...baseProps()} pairing={mock.ALREADY} />);
        expect(getByText('Office Laptop is already connected to this device.')).toBeTruthy();
    });

    it('tablet: Cancel is in the footer of the code screen', () => {
        const props = { ...baseProps(), pairing: mock.CODE, compact: false };
        const { getByText } = render(<AddComputerDialogView {...props} />);
        fireEvent.press(getByText('Cancel'));
        expect(props.onCancel).toHaveBeenCalled();
    });
});

describe('utils', () => {
    it('words the outcomes', () => {
        expect(getWrongCodeMessage(2)).toBe("That code doesn't match. 2 tries left.");
        expect(getFailureMessage('invalidated', 'X', 0)).toBe("That code didn't match three times, so it's no longer valid.");
        expect(getFailureMessage('superseded', 'X', 0)).toBe('Another device is connecting to X. Try again in a moment.');
        expect(getFailureMessage('connection-lost', 'X', 0)).toBe('Lost contact with X. Check that Incyclist is still open on it, then try again.');
        expect(getFailureMessage('version-mismatch', 'X', 0)).toContain("can't connect to this app");
    });

    it('counts down in whole seconds and never below zero', () => {
        expect(secondsLeft(5_500, 1_000)).toBe(5);
        expect(secondsLeft(500, 1_000)).toBe(0);
        expect(secondsLeft(undefined, 1_000)).toBe(0);
    });
});
