import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { WorkoutSettingsDialog } from './WorkoutSettingsDialog';

const mockOnSetLoadIncrement = jest.fn();
const mockGetPageDisplayProps = jest.fn(() => ({ loadIncrement: 1 }));
const mockGetValue = jest.fn((_key: string, def: any) => def);
const mockSetUserSetting = jest.fn();

let capturedHandlers: Record<string, (...args: any[]) => void> = {};
const mockOn = jest.fn((event: string, handler: (...args: any[]) => void) => { capturedHandlers[event] = handler; });
const mockOff = jest.fn();
const mockGetPageObserver = jest.fn(() => ({ on: mockOn, off: mockOff }));

// Single factory (FIXES_BACKLOG #24) - WorkoutSettingsDialog now calls getRidePageService(),
// same as every other ride page consumer; it always resolves to the workout-shaped service here.
jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
        getPageDisplayProps: mockGetPageDisplayProps,
        getPageObserver: mockGetPageObserver,
        onSetLoadIncrement: mockOnSetLoadIncrement,
    }),
    useUserSettings: () => ({ getValue: mockGetValue, set: mockSetUserSetting }),
}));

// Unlike WorkoutRidePage.test.tsx, this test does not mock the View (WorkoutSettingsDialogView
// renders a real Dialog, which needs the real useLogging/useScreenLayout from '../../hooks') - so
// '../../hooks' is left unmocked here; useUnmountEffect's real implementation has no native
// dependency and is safe to exercise as-is.

describe('WorkoutSettingsDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedHandlers = {};
        mockGetPageDisplayProps.mockReturnValue({ loadIncrement: 1 } as any);
        mockGetValue.mockImplementation((_key: string, def: any) => def);
    });

    it('renders without crashing, showing the current loadIncrement from the page service', () => {
        const { getByDisplayValue } = render(<WorkoutSettingsDialog onClose={jest.fn()} />);
        expect(getByDisplayValue('1')).toBeTruthy();
    });

    it('subscribes to page-update on mount (not openPage/closePage - the page is already open, owned by WorkoutRidePage) and unsubscribes on unmount', () => {
        const { unmount } = render(<WorkoutSettingsDialog onClose={jest.fn()} />);
        expect(mockGetPageObserver).toHaveBeenCalledTimes(1);
        expect(mockOn).toHaveBeenCalledWith('page-update', expect.any(Function));

        unmount();
        expect(mockOff).toHaveBeenCalledWith('page-update', expect.any(Function));
    });

    it('reflects a fresh value when the page service emits page-update', () => {
        const { getByDisplayValue } = render(<WorkoutSettingsDialog onClose={jest.fn()} />);

        mockGetPageDisplayProps.mockReturnValue({ loadIncrement: 3 } as any);
        act(() => { capturedHandlers['page-update'](); });

        expect(getByDisplayValue('3')).toBeTruthy();
    });

    it('calls onSetLoadIncrement (not a direct settings write) when the value is edited', () => {
        const { getByDisplayValue } = render(<WorkoutSettingsDialog onClose={jest.fn()} />);

        const input = getByDisplayValue('1');
        fireEvent.changeText(input, '5');
        fireEvent(input, 'endEditing');

        expect(mockOnSetLoadIncrement).toHaveBeenCalledWith(5);
    });

    // Workout Step Change Audio Signal feature: read/written directly via useUserSettings(), not
    // proxied through RidePageService (unlike loadIncrement above) - same direct pattern
    // useRideGestures.ts already uses for its own preferences.workouts.* key.
    it('reads the stepChangeAudioSignal setting from useUserSettings() with the documented default', () => {
        render(<WorkoutSettingsDialog onClose={jest.fn()} />);
        expect(mockGetValue).toHaveBeenCalledWith('preferences.workouts.stepChangeAudioSignal', true);
    });

    it('renders the Step Change Audio toggle and calls userSettings.set (not a service method) when toggled', () => {
        const { getByText } = render(<WorkoutSettingsDialog onClose={jest.fn()} />);
        expect(getByText('Step Change Audio')).toBeTruthy();

        fireEvent.press(getByText('Off'));
        expect(mockSetUserSetting).toHaveBeenCalledWith('preferences.workouts.stepChangeAudioSignal', false);
        expect(mockOnSetLoadIncrement).not.toHaveBeenCalled();
    });

    it('calls onClose when Close is pressed', () => {
        const onClose = jest.fn();
        const { getByText } = render(<WorkoutSettingsDialog onClose={onClose} />);

        fireEvent.press(getByText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
