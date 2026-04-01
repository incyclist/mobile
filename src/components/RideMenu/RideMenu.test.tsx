import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RideMenu } from './RideMenu';
import { getRidePageService } from 'incyclist-services';

// Mock react-native modules
jest.mock('react-native', () => {
    const ActualReactNative = jest.requireActual('react-native');
    return {
        ...ActualReactNative,
        useWindowDimensions: () => ({ width: 1000, height: 800 }), // Mocked dimensions
        Animated: {
            ...ActualReactNative.Animated,
            timing: jest.fn(() => ({ start: jest.fn(cb => cb()) })), // Make animations instant
        },
    };
});

// Mock service
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockOnEndRide = jest.fn();
const mockGetPageDisplayProps = jest.fn(() => ({ menuProps: { showResume: false } }));

jest.mock('incyclist-services', () => ({
    getRidePageService: jest.fn(() => ({
        pause: mockPause,
        resume: mockResume,
        onEndRide: mockOnEndRide,
        getPageDisplayProps: mockGetPageDisplayProps,
    })),
}));

// Mock dialog components to simplify testing RideMenu's rendering logic
jest.mock('../GearSettings', () => ({
    GearSettings: jest.fn(({ onClose }) => <p testID="gear-settings-dialog" onClick={onClose}>Gear Settings</p>),
}));
jest.mock('../SettingsPlaceholder', () => ({
    SettingsPlaceholder: jest.fn(({ onClose }) => <p testID="ride-settings-dialog" onClick={onClose}>Ride Settings</p>),
}));
jest.mock('../ActivitySummaryDialog', () => ({
    ActivitySummaryDialog: jest.fn(({ onClose, onExit }) => <div testID="activity-summary-dialog"><p onClick={onClose}>Close Summary</p><p onClick={onExit}>Exit Summary</p></div>),
}));

// Mock react-native-svg Icon to avoid native module issues
jest.mock('../Icon', () => ({
    Icon: 'Icon', // Simple string mock
}));


describe('RideMenu', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetPageDisplayProps.mockReturnValue({ menuProps: { showResume: false } }); // Default to showing Pause
    });

    it('does not render when visible is false and not animating', () => {
        const { queryByText, queryByTestId } = render(<RideMenu visible={false} onClose={mockOnClose} />);
        expect(queryByText('MENU')).toBeNull();
        // Check if the root container is not interactive
        const rootContainer = queryByTestId('root-ridemenu-container'); // Add testID to root view in RideMenu
        // Since we explicitly control opacity and pointerEvents, the component is rendered
        // but not visually active or interactive.
        // So, we test for the *absence* of the text, and later, the pointer events.
    });

    it('renders visible when visible is true', async () => {
        const { getByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('MENU')).toBeVisible());
        expect(getByText('Pause')).toBeVisible();
        expect(getByText('End Ride')).toBeVisible();
        expect(getByText('Gear Settings')).toBeVisible();
        expect(getByText('Ride Settings')).toBeVisible();
    });

    it('calls onClose when backdrop is pressed (if no dialog is open)', async () => {
        const { getByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByTestId('backdrop')).toBeVisible());
        fireEvent.press(getByTestId('backdrop'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is pressed (if no dialog is open)', async () => {
        const { getByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('MENU')).toBeVisible());
        fireEvent.press(getByText('✕'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('toggles Pause/Resume button based on service props', async () => {
        const { getByText, rerender, queryByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('Pause')).toBeVisible());
        expect(queryByText('Resume')).toBeNull();

        mockGetPageDisplayProps.mockReturnValue({ menuProps: { showResume: true } });
        rerender(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('Resume')).toBeVisible());
        expect(queryByText('Pause')).toBeNull();
    });

    it('calls service.pause and onClose when Pause button is pressed', async () => {
        const { getByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('Pause')).toBeVisible());
        fireEvent.press(getByText('Pause'));
        expect(mockPause).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls service.resume and onClose when Resume button is pressed', async () => {
        mockGetPageDisplayProps.mockReturnValue({ menuProps: { showResume: true } });
        const { getByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('Resume')).toBeVisible());
        fireEvent.press(getByText('Resume'));
        expect(mockResume).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('opens GearSettings dialog when "Gear Settings" is pressed', async () => {
        const { getByText, queryByText, findByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('Gear Settings')).toBeVisible());
        fireEvent.press(getByText('Gear Settings'));
        const dialog = await findByTestId('gear-settings-dialog');
        expect(dialog).toBeVisible();
        expect(queryByText('MENU')).toBeNull(); // Menu panel should be hidden
    });

    it('closes GearSettings dialog when its onClose is called and restores menu', async () => {
        const { getByText, queryByTestId, findByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        fireEvent.press(getByText('Gear Settings'));
        const dialog = await findByTestId('gear-settings-dialog');
        fireEvent.click(dialog); // Simulate onClose being called from dialog
        expect(queryByTestId('gear-settings-dialog')).toBeNull();
        await waitFor(() => expect(getByText('MENU')).toBeVisible()); // Menu panel should reappear
    });

    it('opens RideSettings dialog when "Ride Settings" is pressed', async () => {
        const { getByText, queryByText, findByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('Ride Settings')).toBeVisible());
        fireEvent.press(getByText('Ride Settings'));
        const dialog = await findByTestId('ride-settings-dialog');
        expect(dialog).toBeVisible();
        expect(queryByText('MENU')).toBeNull(); // Menu panel should be hidden
    });

    it('closes RideSettings dialog when its onClose is called and restores menu', async () => {
        const { getByText, queryByTestId, findByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        fireEvent.press(getByText('Ride Settings'));
        const dialog = await findByTestId('ride-settings-dialog');
        fireEvent.click(dialog); // Simulate onClose being called from dialog
        expect(queryByTestId('ride-settings-dialog')).toBeNull();
        await waitFor(() => expect(getByText('MENU')).toBeVisible()); // Menu panel should reappear
    });

    it('calls service.pause and opens ActivitySummaryDialog when "End Ride" is pressed', async () => {
        const { getByText, findByTestId, queryByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        await waitFor(() => expect(getByText('End Ride')).toBeVisible());
        fireEvent.press(getByText('End Ride'));
        expect(mockPause).toHaveBeenCalledTimes(1);
        const dialog = await findByTestId('activity-summary-dialog');
        expect(dialog).toBeVisible();
        expect(queryByText('MENU')).toBeNull(); // Menu panel should be hidden
    });

    it('closes ActivitySummaryDialog and calls service.onEndRide when onExit is called', async () => {
        const { getByText, findByTestId, queryByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        fireEvent.press(getByText('End Ride'));
        const dialog = await findByTestId('activity-summary-dialog');
        fireEvent.click(getByText('Exit Summary')); // Simulate onExit being called from dialog
        expect(queryByTestId('activity-summary-dialog')).toBeNull();
        await waitFor(() => expect(mockOnEndRide).toHaveBeenCalledTimes(1), { timeout: 100 }); // setTimeout(0)
        expect(mockOnClose).not.toHaveBeenCalled(); // Menu remains hidden until explicit onClose (if desired)
    });

    it('closes ActivitySummaryDialog only when onClose is called, not affecting ride state', async () => {
        const { getByText, findByTestId, queryByTestId } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        fireEvent.press(getByText('End Ride'));
        const dialog = await findByTestId('activity-summary-dialog');
        fireEvent.click(getByText('Close Summary')); // Simulate onClose being called from dialog
        expect(queryByTestId('activity-summary-dialog')).toBeNull();
        await waitFor(() => expect(getByText('MENU')).toBeVisible()); // Menu panel should reappear
        expect(mockOnEndRide).not.toHaveBeenCalled(); // onEndRide should not be called
    });

    it('backdrop click when dialog is open closes dialog, not menu', async () => {
        const { getByText, getByTestId, queryByTestId, findByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        fireEvent.press(getByText('Gear Settings'));
        await findByTestId('gear-settings-dialog');

        // Click backdrop
        fireEvent.press(getByTestId('backdrop'));
        expect(queryByTestId('gear-settings-dialog')).toBeNull(); // Dialog closes
        await waitFor(() => expect(findByText('MENU')).toBeVisible()); // Menu reappears
        expect(mockOnClose).not.toHaveBeenCalled(); // Menu itself is not closed
    });

    it('close button click when dialog is open closes dialog, not menu', async () => {
        const { getByText, queryByTestId, findByTestId, findByText } = render(<RideMenu visible={true} onClose={mockOnClose} />);
        fireEvent.press(getByText('Gear Settings'));
        await findByTestId('gear-settings-dialog');

        // Click close button
        fireEvent.press(getByText('✕'));
        expect(queryByTestId('gear-settings-dialog')).toBeNull(); // Dialog closes
        await waitFor(() => expect(findByText('MENU')).toBeVisible()); // Menu reappears
        expect(mockOnClose).not.toHaveBeenCalled(); // Menu itself is not closed
    });
});