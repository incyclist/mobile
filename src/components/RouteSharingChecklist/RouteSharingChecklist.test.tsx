import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RouteSharingChecklist } from './RouteSharingChecklist';

describe('RouteSharingChecklist', () => {
    it('renders the reach checklist with the computer name', () => {
        const { getByText } = render(<RouteSharingChecklist variant="reach" name="Home PC" showLocalNetworkHint={false} />);
        expect(getByText("Can't reach Home PC?")).toBeTruthy();
        expect(getByText('Is Incyclist open on Home PC? Routes are shared only while the app is open.')).toBeTruthy();
    });

    it('renders the find checklist', () => {
        const { getByText } = render(<RouteSharingChecklist variant="find" showLocalNetworkHint={false} />);
        expect(getByText('No computers found')).toBeTruthy();
    });

    it('shows the iOS hint and settings button only when asked to', () => {
        const onOpenSettings = jest.fn();
        const { queryByText, getByText, rerender } = render(
            <RouteSharingChecklist variant="reach" name="PC" showLocalNetworkHint={false} onOpenSettings={onOpenSettings} />,
        );
        expect(queryByText('Open iOS Settings')).toBeNull();

        rerender(<RouteSharingChecklist variant="reach" name="PC" showLocalNetworkHint={true} onOpenSettings={onOpenSettings} />);
        fireEvent.press(getByText('Open iOS Settings'));
        expect(onOpenSettings).toHaveBeenCalled();
    });
});
