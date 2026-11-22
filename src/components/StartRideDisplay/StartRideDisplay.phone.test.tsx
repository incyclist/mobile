import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StartRideDisplay } from './StartRideDisplay';
import { StartRideDisplayProps } from './types';
import { startDevice, startDevices } from './StartRideDisplay.mock';

const mockLogEvent = jest.fn();
jest.mock('../../hooks', () => ({
    ...jest.requireActual('../../hooks'),
    useLogging: () => ({ logEvent: mockLogEvent, logError: jest.fn() }),
}));

const mockDimensions = { width: 800, height: 360 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}));

const noop = () => {};
const { trainer, bikeControl, h6m } = startDevices;

const make = (extra: Record<string, unknown> = {}) => ({
    mode: 'GPX',
    rideState: 'Starting',
    readyToStart: true,
    startPhase: 'ready',
    devices: [trainer(), h6m(), bikeControl()],
    startContent: { kind: 'map', label: 'Map', state: 'ready' },
    startReadyInfo: { pendingSensors: ['H6M 58398'], notConnectedSensors: ['BikeControl 2161'], viewFallback: false },
    onStart: noop, onRetry: noop, onCancel: noop, onIgnore: noop,
    onRetryDevice: noop, onIgnoreDevice: noop,
    ...extra,
}) as unknown as StartRideDisplayProps;

const rowOrder = (toJSON: () => unknown) => {
    const json = JSON.stringify(toJSON());
    return [...json.matchAll(/start-row-([\w-]+)/g)].map(m => m[1]);
};

describe('StartRideDisplay (phone, phased)', () => {
    beforeEach(() => {
        mockDimensions.width = 800;
        mockDimensions.height = 360;
        mockLogEvent.mockClear();
    });

    it('moves resolved items into the footer note and lists open sensors worst first', () => {
        const { getByText, queryByTestId, toJSON } = render(<StartRideDisplay {...make()} />);

        expect(getByText('✓ KICKR CORE · Map')).toBeTruthy();
        expect(queryByTestId('start-row-trainer-1')).toBeNull();
        expect(queryByTestId('start-row-content')).toBeNull();
        expect(rowOrder(toJSON)).toEqual(['bike-1', 'h6m-1']);
    });

    it('shows no divider in the ready phase', () => {
        const { queryByTestId } = render(<StartRideDisplay {...make()} />);
        expect(queryByTestId('start-optional-divider')).toBeNull();
    });

    it('keeps the divider while blocking rows and sensors are both open', () => {
        const props = make({
            startPhase: 'content', readyToStart: false,
            startContent: { kind: 'map', label: 'Map', state: 'loading' },
        });
        const { getByTestId } = render(<StartRideDisplay {...props} />);
        expect(getByTestId('start-row-content')).toBeTruthy();
        expect(getByTestId('start-optional-divider')).toBeTruthy();
    });

    it('shows an amber notice naming the kind of device', () => {
        const { getByTestId } = render(<StartRideDisplay {...make()} />);
        expect(getByTestId('start-notice-title').props.children).toBe("2 sensors aren't connected yet");
        expect(getByTestId('start-notice-detail').props.children).toBe('Controller, heart rate sensor · You can start without them.');
    });

    it('drops the notice detail below 340 dp', () => {
        mockDimensions.height = 320;
        const { queryByTestId, getByTestId } = render(<StartRideDisplay {...make()} />);
        expect(getByTestId('start-notice-title')).toBeTruthy();
        expect(queryByTestId('start-notice-detail')).toBeNull();
    });

    it('keeps a failed row first after Retry (ratchet)', () => {
        const { rerender, toJSON } = render(<StartRideDisplay {...make()} />);
        const retried = [trainer(), h6m(), bikeControl({ startState: 'starting', status: 'Starting' })];
        rerender(<StartRideDisplay {...make({ devices: retried })} />);
        expect(rowOrder(toJSON)).toEqual(['bike-1', 'h6m-1']);
    });

    it('lets a started row leave the list and join the footer note', () => {
        const { rerender, queryByTestId, getByText } = render(<StartRideDisplay {...make()} />);
        const devices = [trainer(), h6m({ startState: 'started', status: 'Started' }), bikeControl()];
        rerender(<StartRideDisplay {...make({ devices })} />);
        expect(queryByTestId('start-row-h6m-1')).toBeNull();
        expect(getByText('✓ KICKR CORE · Map · H6M 58398')).toBeTruthy();
    });

    it('logs a button click for Retry and Ignore', () => {
        const onRetryDevice = jest.fn();
        const { getByLabelText } = render(<StartRideDisplay {...make({ onRetryDevice })} />);

        fireEvent.press(getByLabelText('Retry BikeControl 2161'));
        fireEvent.press(getByLabelText('Ignore BikeControl 2161'));

        expect(onRetryDevice).toHaveBeenCalledWith('bike-1');
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({
            message: 'button clicked', button: 'Retry', device: 'BikeControl 2161', isControl: false,
        }));
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'button clicked', button: 'Ignore' }));
    });

    it('has the same fixed row height with and without actions', () => {
        const { getByTestId } = render(<StartRideDisplay {...make()} />);
        const plain = render(<StartRideDisplay {...make({ devices: [trainer(), startDevice({ udid: 'p', name: 'Plain' })] })} />);
        const height = (node: { props: Record<string, any> }) => JSON.stringify(node.props.style);
        expect(height(getByTestId('start-row-bike-1'))).toContain('"height":44');
        expect(height(plain.getByTestId('start-row-p'))).toContain('"height":44');
    });
});

describe('StartRideDisplay (tablet, phased ready)', () => {
    beforeEach(() => {
        mockDimensions.width = 1180;
        mockDimensions.height = 820;
    });

    it('keeps resolved rows and the divider, and sorts problems first inside Optional', () => {
        const { queryByTestId, toJSON } = render(<StartRideDisplay {...make()} />);
        expect(queryByTestId('start-optional-divider')).toBeTruthy();
        expect(rowOrder(toJSON)).toEqual(['trainer-1', 'content', 'bike-1', 'h6m-1']);
    });

    it('does not use the footer note', () => {
        const { queryByText } = render(<StartRideDisplay {...make()} />);
        expect(queryByText('✓ KICKR CORE · Map')).toBeNull();
    });
});
