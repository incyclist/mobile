import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RouteServersDialogView } from './RouteServersDialogView';
import { RouteServersDialogViewProps } from './types';
import {
    addProps,
    listProps,
    KNOWN_ADDED,
    KNOWN_CHECKING,
    KNOWN_AVAILABLE,
    KNOWN_ERROR,
    REMOVE_WITH_ROUTES,
    SERVER_ALPINE,
    SERVER_UNREACHABLE,
} from './RouteServersDialog.mock';

// the dialog is mocked: it renders its title, its footer buttons and its content
jest.mock('../Dialog', () => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return {
        Dialog: ({ title, buttons, children }: any) => (
            <View>
                <Text>{title}</Text>
                {children}
                {(buttons ?? []).map((b: any) => (
                    <TouchableOpacity key={b.id} onPress={b.onClick} disabled={b.disabled}>
                        <Text>{b.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        ),
    };
});

const actionProps = () => ({
    onClose: jest.fn(),
    onBack: jest.fn(),
    onShowAdd: jest.fn(),
    onShowManualEntry: jest.fn(),
    onAddKnown: jest.fn(),
    onRetryKnown: jest.fn(),
    onSetManualUrl: jest.fn(),
    onSetManualName: jest.fn(),
    onCheckAndAdd: jest.fn(),
    onCheck: jest.fn(),
    onAdd: jest.fn(),
    onConfirmAddEmpty: jest.fn(),
    onCancelAddEmpty: jest.fn(),
    onRequestRemove: jest.fn(),
    onSetRemoveRoutes: jest.fn(),
    onConfirmRemove: jest.fn(),
    onCancelRemove: jest.fn(),
});

const setup = (overrides: Partial<RouteServersDialogViewProps>) => {
    const props = { compact: false, displayProps: listProps([]), ...actionProps(), ...overrides };
    return { props, ...render(<RouteServersDialogView {...props} />) };
};

describe('RouteServersDialogView', () => {
    describe('list', () => {
        it('shows the built-in server and the servers of the user with their status', () => {
            const { getByText, getByLabelText } = setup({
                displayProps: listProps([SERVER_ALPINE, SERVER_UNREACHABLE]),
            });

            expect(getByText('Route Servers')).toBeTruthy();
            expect(getByText('Incyclist')).toBeTruthy();
            expect(getByText('Built in')).toBeTruthy();
            expect(getByLabelText('Alpine Videos, 24 routes')).toBeTruthy();
            expect(getByLabelText(`Ride with Jan, ${SERVER_UNREACHABLE.statusText}`)).toBeTruthy();
        });

        it('offers Remove only for servers that can be removed', () => {
            const { getAllByText, props } = setup({ displayProps: listProps([SERVER_ALPINE]) });

            const removes = getAllByText('Remove');
            expect(removes).toHaveLength(1);
            fireEvent.press(removes[0]);
            expect(props.onRequestRemove).toHaveBeenCalledWith('Alpine Videos');
        });

        it('shows the status below the name on a phone', () => {
            const { getAllByText } = setup({ compact: true, displayProps: listProps([SERVER_ALPINE]) });
            expect(getAllByText('24 routes')).toHaveLength(1);
        });

        it('has "+ Add route server" as the first footer button, followed by Close', () => {
            const { getByText, props } = setup({ displayProps: listProps([SERVER_ALPINE]) });

            fireEvent.press(getByText('+ Add route server'));
            expect(props.onShowAdd).toHaveBeenCalled();
            fireEvent.press(getByText('Close'));
            expect(props.onClose).toHaveBeenCalled();
        });

        it('shows the empty state with a primary button instead of the footer button', () => {
            const { getByText, queryByText, props } = setup({ displayProps: listProps([]) });

            expect(getByText('Get more routes from other providers')).toBeTruthy();
            expect(queryByText('+ Add route server')).toBeNull();
            fireEvent.press(getByText('Add route server'));
            expect(props.onShowAdd).toHaveBeenCalled();
        });
    });

    describe('remove confirmation', () => {
        it('is shown with the texts of the dialog service and reports the choice', () => {
            const { getByText, props } = setup({
                displayProps: listProps([SERVER_ALPINE], { removeDialog: REMOVE_WITH_ROUTES }),
            });

            expect(getByText('Remove "Alpine Videos"?')).toBeTruthy();
            fireEvent.press(getByText(REMOVE_WITH_ROUTES.removeRoutesLabel));
            expect(props.onSetRemoveRoutes).toHaveBeenCalledWith(true);
            fireEvent.press(getByText('Keep these routes'));
            expect(props.onSetRemoveRoutes).toHaveBeenCalledWith(false);
            fireEvent.press(getByText('Remove server'));
            expect(props.onConfirmRemove).toHaveBeenCalled();
            fireEvent.press(getByText('Cancel'));
            expect(props.onCancelRemove).toHaveBeenCalled();
        });
    });

    describe('add view on a tablet', () => {
        it('shows known servers and the address form side by side', () => {
            const { getByText, props } = setup({
                displayProps: addProps([KNOWN_AVAILABLE, KNOWN_ADDED]),
            });

            expect(getByText('Add a route server')).toBeTruthy();
            expect(getByText('Known servers')).toBeTruthy();
            expect(getByText('Or enter an address')).toBeTruthy();
            expect(getByText('Added ✓ · 12 routes')).toBeTruthy();
            fireEvent.press(getByText('Add'));
            expect(props.onAddKnown).toHaveBeenCalledWith(KNOWN_AVAILABLE.id);
        });

        it('renders the ready-made status text of a known server as it is', () => {
            const { getByText, queryByText } = setup({
                displayProps: addProps([
                    { ...KNOWN_ADDED, routeCount: 3, statusText: 'Added ✓' },
                    { ...KNOWN_CHECKING, statusText: 'Checking now…' },
                ]),
            });

            expect(getByText('Added ✓')).toBeTruthy();
            expect(queryByText(/routes?$/)).toBeNull();
            expect(getByText('Checking now…')).toBeTruthy();
        });

        it('offers a retry for a known server that failed', () => {
            const { getByText, props } = setup({ displayProps: addProps([KNOWN_ERROR]) });

            expect(getByText(KNOWN_ERROR.error as string)).toBeTruthy();
            fireEvent.press(getByText('Try again'));
            expect(props.onRetryKnown).toHaveBeenCalledWith(KNOWN_ERROR.id);
        });

        it('hides the known section if there are no known servers', () => {
            const { queryByText } = setup({ displayProps: addProps([]) });
            expect(queryByText('Known servers')).toBeNull();
        });

        it('checks and adds in one step, only if the dialog service allows it', () => {
            const enabled = setup({ displayProps: addProps([], { url: 'a.example', name: 'A', canSubmit: true }) });
            fireEvent.press(enabled.getByText('Check and add'));
            expect(enabled.props.onCheckAndAdd).toHaveBeenCalled();

            const disabled = setup({ displayProps: addProps([], { url: 'a.example', canSubmit: false }) });
            fireEvent.press(disabled.getByText('Check and add'));
            expect(disabled.props.onCheckAndAdd).not.toHaveBeenCalled();
        });

        it('shows the errors below the fields', () => {
            const { getByText } = setup({
                displayProps: addProps([], { state: 'error', urlError: 'URL BAD', nameError: 'NAME BAD' }),
            });
            expect(getByText('URL BAD')).toBeTruthy();
            expect(getByText('NAME BAD')).toBeTruthy();
        });

        it('asks for confirmation when the server has no routes', () => {
            const { getByText, props } = setup({
                displayProps: addProps([], { state: 'confirm-empty', message: 'No routes. Add it anyway?' }),
            });

            fireEvent.press(getByText('Add anyway'));
            expect(props.onConfirmAddEmpty).toHaveBeenCalled();
            fireEvent.press(getByText('Cancel'));
            expect(props.onCancelAddEmpty).toHaveBeenCalled();
        });

        it('offers Add after a check that waits for confirmation', () => {
            const { getByText, props } = setup({
                displayProps: addProps([], { state: 'checked', message: 'Found 7 routes.', canSubmit: true }),
            });

            expect(getByText('✓ Found 7 routes.')).toBeTruthy();
            fireEvent.press(getByText('Add'));
            expect(props.onAdd).toHaveBeenCalled();
        });

        it('goes back with the Back button', () => {
            const { getByText, props } = setup({ displayProps: addProps([]) });
            fireEvent.press(getByText('Back'));
            expect(props.onBack).toHaveBeenCalled();
        });
    });

    describe('add view on a phone', () => {
        it('starts with the known servers and a row to enter an address', () => {
            const { getByText, queryByText, props } = setup({ compact: true, displayProps: addProps([KNOWN_AVAILABLE]) });

            expect(queryByText('Or enter an address')).toBeNull();
            fireEvent.press(getByText('Enter an address yourself'));
            expect(props.onShowManualEntry).toHaveBeenCalled();
        });

        it('checks with the inline button and has no name field before the check', () => {
            const { getByText, queryByText, props } = setup({
                compact: true,
                displayProps: addProps([KNOWN_AVAILABLE], { url: 'a.example', canCheck: true }, { view: 'add-manual' }),
            });

            expect(getByText('Enter an address')).toBeTruthy();
            expect(queryByText('Name (shown in your route list) *')).toBeNull();
            fireEvent.press(getByText('Check'));
            expect(props.onCheck).toHaveBeenCalled();
        });

        it('shows the name after the check and moves Add into the footer', () => {
            const { getByText, props } = setup({
                compact: true,
                displayProps: addProps(
                    [KNOWN_AVAILABLE],
                    { url: 'a.example', name: 'A', state: 'checked', message: 'Found 9 routes.', canSubmit: true },
                    { view: 'add-manual' }
                ),
            });

            expect(getByText('Name (shown in your route list) *')).toBeTruthy();
            fireEvent.press(getByText('Add'));
            expect(props.onAdd).toHaveBeenCalled();
        });

        it('keeps Add disabled while the name is not valid', () => {
            const { getByText, props } = setup({
                compact: true,
                displayProps: addProps(
                    [KNOWN_AVAILABLE],
                    { url: 'a.example', name: '', state: 'checked', canSubmit: false },
                    { view: 'add-manual' }
                ),
            });

            fireEvent.press(getByText('Add'));
            expect(props.onAdd).not.toHaveBeenCalled();
        });

        it('shows the manual entry right away if there are no known servers', () => {
            const { getByText } = setup({ compact: true, displayProps: addProps([]) });
            expect(getByText('Check')).toBeTruthy();
        });
    });
});
