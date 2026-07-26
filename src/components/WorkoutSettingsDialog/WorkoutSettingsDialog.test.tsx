import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { WorkoutSettingsDialog } from './WorkoutSettingsDialog';

const mockOnSetLoadIncrement = jest.fn();
const mockGetPageDisplayProps = jest.fn(() => ({ loadIncrement: 1 }));

let capturedHandlers: Record<string, (...args: any[]) => void> = {};
const mockOn = jest.fn((event: string, handler: (...args: any[]) => void) => { capturedHandlers[event] = handler; });
const mockOff = jest.fn();
const mockGetPageObserver = jest.fn(() => ({ on: mockOn, off: mockOff }));

jest.mock('incyclist-services', () => ({
    getWorkoutRidePageService: () => ({
        getPageDisplayProps: mockGetPageDisplayProps,
        getPageObserver: mockGetPageObserver,
        onSetLoadIncrement: mockOnSetLoadIncrement,
    }),
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

    it('calls onClose when Close is pressed', () => {
        const onClose = jest.fn();
        const { getByText } = render(<WorkoutSettingsDialog onClose={onClose} />);

        fireEvent.press(getByText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
